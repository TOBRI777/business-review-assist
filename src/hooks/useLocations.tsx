import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id: string;
  google_location_id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  location_settings?: {
    requires_approval: boolean;
    custom_tone?: string;
  };
}

export const useLocations = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          location_settings (
            requires_approval,
            custom_tone
          )
        `)
        
        .order('name');

      if (error) throw error;

      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les établissements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocationSettings = async (locationId: string, settings: { requires_approval: boolean; custom_tone?: string }) => {
    try {
      const { error } = await supabase
        .from('location_settings')
        .upsert({
          location_id: locationId,
          ...settings,
        });

      if (error) throw error;

      await fetchLocations();
      toast({
        title: "Succès",
        description: "Paramètres de l'établissement mis à jour",
      });
    } catch (error) {
      console.error('Error updating location settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
    }
  };

  return {
    locations,
    loading,
    updateLocationSettings,
    refetch: fetchLocations,
  };
};