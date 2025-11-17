import { useState, useEffect } from 'react';
import { roleService, UserRole } from '@/services/roleService';
import { supabase } from '@/integrations/supabase/client';

export const useRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRole = async () => {
    setLoading(true);
    const userRole = await roleService.getUserRole();
    setRole(userRole);
    setIsAdmin(userRole === 'ADMIN');
    setIsPro(userRole === 'PRO' || userRole === 'ADMIN');
    setLoading(false);
  };

  return { role, isAdmin, isPro, loading, refetch: loadRole };
};