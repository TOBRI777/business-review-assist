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

    // Get user settings for Google API key
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('google_api_key_encrypted')
      .single();

    if (settingsError || !settings?.google_api_key_encrypted) {
      throw new Error('Google API key not configured');
    }

    // First, get accounts
    const accountsResponse = await fetch(
      'https://mybusiness.googleapis.com/v4/accounts',
      {
        headers: {
          'Authorization': `Bearer ${settings.google_api_key_encrypted}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch Google My Business accounts');
    }

    const accountsData = await accountsResponse.json();
    
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google My Business accounts found');
    }

    let allLocations = [];

    // Fetch locations for each account
    for (const account of accountsData.accounts) {
      const locationsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/${account.name}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${settings.google_api_key_encrypted}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        if (locationsData.locations) {
          allLocations.push(...locationsData.locations);
        }
      }
    }

    // Store new locations in database
    let newLocationsCount = 0;
    
    for (const location of allLocations) {
      // Check if location already exists
      const { data: existingLocation } = await supabaseClient
        .from('locations')
        .select('id')
        .eq('google_location_id', location.name)
        .single();

      if (!existingLocation) {
        // Insert new location
        const { error: insertError } = await supabaseClient
          .from('locations')
          .insert({
            google_location_id: location.name,
            name: location.locationName || 'Location',
            address: location.address ? 
              `${location.address.addressLines?.join(', ') || ''} ${location.address.locality || ''} ${location.address.postalCode || ''}`.trim() : 
              null,
            phone: location.primaryPhone,
            is_active: true,
          });

        if (!insertError) {
          newLocationsCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalLocations: allLocations.length,
        newLocations: newLocationsCount,
        locations: allLocations.map(loc => ({
          id: loc.name,
          name: loc.locationName,
          address: loc.address ? 
            `${loc.address.addressLines?.join(', ') || ''} ${loc.address.locality || ''} ${loc.address.postalCode || ''}`.trim() : 
            null,
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-google-locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});