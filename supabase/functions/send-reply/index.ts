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
    const { replyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the reply and associated review
    const { data: reply, error: replyError } = await supabaseClient
      .from('review_replies')
      .select(`
        *,
        review:reviews(
          google_review_id,
          location:locations(google_location_id)
        )
      `)
      .eq('id', replyId)
      .eq('status', 'approved')
      .single();

    if (replyError || !reply) {
      throw new Error('Approved reply not found');
    }

    // Get user settings for Google API key
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('google_api_key_encrypted')
      .single();

    if (settingsError || !settings?.google_api_key_encrypted) {
      throw new Error('Google API key not configured');
    }

    // Send reply to Google My Business
    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/*/locations/${reply.review.location.google_location_id}/reviews/${reply.review.google_review_id}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${settings.google_api_key_encrypted}`,
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
    const { error: updateError } = await supabaseClient
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