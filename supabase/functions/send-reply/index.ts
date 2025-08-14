import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { open } from '../_utils/crypto.ts';

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

    // Get the reply and associated review
    const { data: reply, error: replyError } = await supabase
      .from('review_replies')
      .select(`
        *,
        review:reviews(
          google_review_id,
          location:locations(google_location_id, user_id)
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
      .select('google_oauth_access_token_encrypted')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.google_oauth_access_token_encrypted) {
      throw new Error('Google OAuth not configured');
    }

    // Decrypt access token
    const accessToken = await open(JSON.parse(settings.google_oauth_access_token_encrypted));

    // Send reply to Google My Business
    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/*/locations/${reply.review.location.google_location_id}/reviews/${reply.review.google_review_id}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: reply.generated_reply
        }),
      }
    );

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