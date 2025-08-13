import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  id: string;
  global_tone: string;
  google_api_key_encrypted?: string;
  openai_api_key_encrypted?: string;
}

export const useUserSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Succès",
        description: "Paramètres mis à jour",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};