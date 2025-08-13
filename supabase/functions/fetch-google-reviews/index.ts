import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user settings to retrieve Google API key
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('google_api_key_encrypted')
      .single();

    if (settingsError) {
      throw new Error('Failed to fetch user settings');
    }

    if (!settings?.google_api_key_encrypted) {
      throw new Error('Google API key not configured');
    }

    // Get user locations
    const { data: locations, error: locationsError } = await supabaseClient
      .from('locations')
      .select('*')
      .eq('is_active', true);

    if (locationsError) {
      throw new Error('Failed to fetch locations');
    }

    let totalNewReviews = 0;

    // Fetch reviews for each location
    for (const location of locations || []) {
      const googlePlaceId = location.google_location_id;
      
      // Google My Business API call to fetch reviews
      const reviewsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/*/locations/${googlePlaceId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${settings.google_api_key_encrypted}`,
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
        const { data: existingReview } = await supabaseClient
          .from('reviews')
          .select('id')
          .eq('google_review_id', review.reviewId)
          .single();

        if (!existingReview) {
          // Insert new review
          const { error: insertError } = await supabaseClient
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