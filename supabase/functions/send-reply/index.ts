import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { open, seal } from '../_utils/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { replyId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const getUserIdFromReq = async (req: Request) => {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) return data.user.id;
      }
      const dev = Deno.env.get('DEV_USER_ID');
      if (dev) return dev;
      throw new Error('No auth and no DEV_USER_ID');
    };

    const userId = await getUserIdFromReq(req);

    // Get the reply and associated review with location
    const { data: reply, error: replyError } = await supabase
      .from('review_replies')
      .select(`
        *,
        review:reviews(
          google_review_id,
          location:locations(google_location_name, user_id)
        )
      `)
      .eq('id', replyId)
      .eq('status', 'approved')
      .single();

    if (replyError || !reply || reply.review.location.user_id !== userId) {
      throw new Error('Approved reply not found');
    }

    // Get user settings for Google OAuth tokens
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_oauth_access_token_encrypted, google_oauth_refresh_token_encrypted, google_oauth_token_expiry')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.google_oauth_access_token_encrypted) {
      throw new Error('Google OAuth not configured');
    }

    // Decrypt and check if token needs refresh
    let accessToken = await open(JSON.parse(settings.google_oauth_access_token_encrypted));
    const tokenExpiry = new Date(settings.google_oauth_token_expiry);
    const now = new Date();

    if (now >= tokenExpiry && settings.google_oauth_refresh_token_encrypted) {
      // Decrypt refresh token and refresh the access token
      const refreshToken = await open(JSON.parse(settings.google_oauth_refresh_token_encrypted));
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();
        accessToken = tokens.access_token;
        
        // Update tokens in database with encryption
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + tokens.expires_in);
        
        const encryptedAccessToken = await seal(accessToken);
        
        await supabase
          .from('user_settings')
          .update({
            google_oauth_access_token_encrypted: JSON.stringify(encryptedAccessToken),
            google_oauth_token_expiry: newExpiry.toISOString(),
          })
          .eq('user_id', userId);
      }
    }

    // Send reply to Google My Business using correct endpoint
    const replyUrl = `https://mybusiness.googleapis.com/v4/${reply.review.location.google_location_name}/reviews/${reply.review.google_review_id}/reply`;
    const googleResponse = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: reply.generated_reply
      }),
    });

    if (!googleResponse.ok) {
      throw new Error('Failed to send reply to Google');
    }

    // Update reply status to sent
    const { error: updateError } = await supabase
      .from('review_replies')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', replyId);

    if (updateError) {
      throw new Error('Failed to update reply status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reply sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-reply:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});