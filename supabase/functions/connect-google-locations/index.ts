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

    let connectedLocations = 0;

    // Step 1: Get all accessible accounts
    const accountsResponse = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    console.log(`Found ${accounts.length} accessible accounts`);

    // Step 2: For each account, get all locations
    for (const account of accounts) {
      const accountName = account.name; // format: accounts/123456789
      
      const locationsResponse = await fetch(`https://mybusiness.googleapis.com/v4/${accountName}/locations?readMask=name,title,storefrontAddress,primaryPhone&pageSize=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!locationsResponse.ok) {
        console.warn(`Failed to fetch locations for account ${accountName}: ${locationsResponse.status}`);
        continue;
      }

      const locationsData = await locationsResponse.json();
      const locations = locationsData.locations || [];

      console.log(`Found ${locations.length} locations for account ${accountName}`);

      // Step 3: Store each location in database
      for (const location of locations) {
        const locationName = location.name; // format: accounts/123/locations/456
        const googleLocationId = locationName.split('/').pop(); // Extract location ID
        
        const address = location.storefrontAddress ? 
          `${location.storefrontAddress.addressLines?.join(', ') || ''} ${location.storefrontAddress.locality || ''} ${location.storefrontAddress.postalCode || ''}`.trim() : 
          null;

        // Upsert location
        const { error: locationError } = await supabase
          .from('locations')
          .upsert({
            user_id: userId,
            google_location_id: googleLocationId,
            name: location.title || 'Unknown Location',
            address: address,
            phone: location.primaryPhone || null,
            is_active: true,
          }, {
            onConflict: 'user_id,google_location_id'
          });

        if (locationError) {
          console.error(`Error storing location ${googleLocationId}:`, locationError);
        } else {
          connectedLocations++;
          console.log(`Stored location: ${location.title} (${googleLocationId})`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully connected ${connectedLocations} locations`,
      locationsFound: connectedLocations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connect-google-locations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});