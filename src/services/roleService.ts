import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'USER' | 'PRO' | 'ADMIN';

export const roleService = {
  async getUserRole(): Promise<UserRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_user_role', {
      _user_id: user.id
    });

    if (error) {
      console.error('Error getting user role:', error);
      return 'USER'; // Default to USER on error
    }

    return data as UserRole;
  },

  async hasRole(role: UserRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: role
    });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return data as boolean;
  },

  async isAdmin(): Promise<boolean> {
    return this.hasRole('ADMIN');
  },

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(r => r.role as UserRole);
  },

  async assignRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) throw error;
  },

  async removeRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) throw error;
  }
};