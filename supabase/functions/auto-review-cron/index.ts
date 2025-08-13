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

    console.log('Starting automated review processing...');

    // 1. Fetch new reviews
    console.log('Fetching new reviews...');
    const fetchResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-google-reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const fetchResult = await fetchResponse.json();
    console.log('Fetch result:', fetchResult);

    // 2. Get reviews without replies
    const { data: reviewsWithoutReplies, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select('id')
      .not('id', 'in', 
        `(${(await supabaseClient.from('review_replies').select('review_id')).data?.map(r => r.review_id).join(',') || 'null'})`
      );

    if (reviewsError) {
      console.error('Error fetching reviews without replies:', reviewsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), { status: 500 });
    }

    console.log(`Found ${reviewsWithoutReplies?.length || 0} reviews without replies`);

    // 3. Generate AI replies for each review
    let repliesGenerated = 0;
    for (const review of reviewsWithoutReplies || []) {
      try {
        const generateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ai-reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviewId: review.id }),
        });

        if (generateResponse.ok) {
          repliesGenerated++;
          console.log(`Generated reply for review ${review.id}`);
        }
      } catch (error) {
        console.error(`Failed to generate reply for review ${review.id}:`, error);
      }
    }

    // 4. Send approved replies
    const { data: approvedReplies, error: approvedError } = await supabaseClient
      .from('review_replies')
      .select('id')
      .eq('status', 'approved');

    if (approvedError) {
      console.error('Error fetching approved replies:', approvedError);
    } else {
      console.log(`Found ${approvedReplies?.length || 0} approved replies to send`);

      let repliesSent = 0;
      for (const reply of approvedReplies || []) {
        try {
          const sendResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-reply`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ replyId: reply.id }),
          });

          if (sendResponse.ok) {
            repliesSent++;
            console.log(`Sent reply ${reply.id}`);
          }
        } catch (error) {
          console.error(`Failed to send reply ${reply.id}:`, error);
        }
      }
    }

    const summary = {
      newReviewsFetched: fetchResult.newReviews || 0,
      repliesGenerated,
      repliesSent: approvedReplies?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('Automation summary:', summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        message: 'Automated review processing completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-review-cron:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});