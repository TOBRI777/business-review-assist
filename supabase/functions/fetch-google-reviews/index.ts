import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Invalid auth token');
    }

    const userId = userData.user.id;

    // Get user's Google OAuth tokens
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_oauth_access_token_encrypted, google_oauth_refresh_token_encrypted, google_oauth_token_expiry')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.google_oauth_access_token_encrypted) {
      throw new Error('Google OAuth not configured for this user');
    }

    // Check if token needs refresh
    let accessToken = settings.google_oauth_access_token_encrypted;
    const tokenExpiry = new Date(settings.google_oauth_token_expiry);
    const now = new Date();

    if (now >= tokenExpiry && settings.google_oauth_refresh_token_encrypted) {
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: settings.google_oauth_refresh_token_encrypted,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();
        accessToken = tokens.access_token;
        
        // Update tokens in database
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + tokens.expires_in);
        
        await supabase
          .from('user_settings')
          .update({
            google_oauth_access_token_encrypted: accessToken,
            google_oauth_token_expiry: newExpiry.toISOString(),
          })
          .eq('user_id', userId);
      }
    }

    // Get user locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (locationsError) {
      throw new Error('Failed to fetch locations');
    }

    let totalNewReviews = 0;

    // Fetch reviews for each location
    for (const location of locations || []) {
      const googleLocationId = location.google_location_id;
      
      // Google My Business API call to fetch reviews for this specific location
      const reviewsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/-/locations/${googleLocationId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!reviewsResponse.ok) {
        console.error(`Failed to fetch reviews for location ${location.id}`);
        continue;
      }

      const reviewsData = await reviewsResponse.json();
      
      // Process and store new reviews
      for (const review of reviewsData.reviews || []) {
        // Check if review already exists
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('google_review_id', review.reviewId)
          .single();

        if (!existingReview) {
          // Insert new review
          const { error: insertError } = await supabase
            .from('reviews')
            .insert({
              google_review_id: review.reviewId,
              location_id: location.id,
              author_name: review.reviewer?.displayName || 'Anonyme',
              author_photo_url: review.reviewer?.profilePhotoUrl,
              rating: review.starRating === 'FIVE' ? 5 : 
                     review.starRating === 'FOUR' ? 4 :
                     review.starRating === 'THREE' ? 3 :
                     review.starRating === 'TWO' ? 2 : 1,
              review_text: review.comment,
              review_date: new Date(review.createTime).toISOString(),
            });

          if (!insertError) {
            totalNewReviews++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newReviews: totalNewReviews,
        message: `Fetched ${totalNewReviews} new reviews`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-google-reviews:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});