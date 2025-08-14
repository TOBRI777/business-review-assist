import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { seal } from "../_utils/crypto.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { openaiKey } = await req.json();
    if (!openaiKey) return new Response(JSON.stringify({ error: "Missing openaiKey" }), { status: 400, headers: cors });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

    // user id: auth Bearer ou fallback DEV_USER_ID
    const auth = req.headers.get("Authorization");
    let userId: string | null = null;
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length);
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }
    if (!userId) userId = Deno.env.get("DEV_USER_ID") ?? null;
    if (!userId) return new Response(JSON.stringify({ error: "No auth and no DEV_USER_ID" }), { status: 401, headers: cors });

    const sealed = await seal(openaiKey);
    const { error } = await supabase.from("user_settings").update({
      openai_api_key_encrypted: JSON.stringify(sealed)
    }).eq("user_id", userId);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});