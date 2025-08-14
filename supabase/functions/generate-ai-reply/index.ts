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
    const { reviewId } = await req.json();

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

    // Get the review details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        location:locations(
          name,
          user_id,
          location_settings(custom_tone, requires_approval)
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review || review.location.user_id !== userId) {
      throw new Error('Review not found');
    }

    // Get user settings for OpenAI key and global tone
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('openai_api_key_encrypted, global_tone')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.openai_api_key_encrypted) {
      throw new Error('OpenAI API key not configured');
    }

    // Determine the tone to use (custom location tone or global tone)
    const tone = review.location?.location_settings?.custom_tone || settings.global_tone || 
                 'Répondez de manière professionnelle et amicale.';

    // Create prompt for OpenAI
    const prompt = `
Vous devez rédiger une réponse professionnelle à cet avis client :

Établissement: ${review.location?.name}
Note: ${review.rating}/5 étoiles
Auteur: ${review.author_name}
Avis: "${review.review_text || 'Aucun commentaire écrit'}"

Instructions de ton: ${tone}

Rédigez une réponse appropriée, personnalisée et professionnelle en français. La réponse doit être concise (maximum 200 caractères) et adaptée à la note donnée.
`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openai_api_key_encrypted}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Vous êtes un assistant spécialisé dans la rédaction de réponses aux avis clients.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate AI reply');
    }

    const aiData = await openaiResponse.json();
    const generatedReply = aiData.choices[0].message.content;

    // Determine status based on location settings
    const requiresApproval = review.location?.location_settings?.requires_approval ?? true;
    const status = requiresApproval ? 'pending' : 'approved';

    // Store the generated reply
    const { data: reply, error: replyError } = await supabase
      .from('review_replies')
      .insert({
        review_id: reviewId,
        generated_reply: generatedReply,
        status: status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (replyError) {
      throw new Error('Failed to store reply');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply: reply,
        message: `Reply generated and ${status}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-reply:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});