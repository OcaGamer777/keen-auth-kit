import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { profileService } from '@/services/profileService';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Crown } from 'lucide-react';
import { Profile as ProfileType } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Profile() {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await profileService.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('profile.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('profile.passwordMinLength'),
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t('profile.passwordUpdated'),
        description: t('profile.passwordChanged'),
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('profile.passwordError'),
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const getRoleIcon = () => {
    if (role === 'ADMIN') return <Shield className="w-6 h-6 text-destructive" />;
    if (role === 'PRO') return <Crown className="w-6 h-6 text-primary" />;
    return <User className="w-6 h-6 text-muted-foreground" />;
  };

  const getRoleName = () => {
    if (role === 'ADMIN') return t('profile.admin');
    if (role === 'PRO') return t('profile.pro');
    return t('profile.free');
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">{t('profile.title')}</h1>

        {/* Profile Info */}
        <Card className="p-6 bg-card/50 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.username}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {getRoleIcon()}
                  <span>{getRoleName()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">{t('profile.progressByLevel')}</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(level => {
                  const levelProgress = profile.level_progress?.[level];
                  const highscore = levelProgress?.highscore || 0;
                  
                  return (
                    <div key={level} className="p-3 bg-secondary rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{t('levels.level')} {level}</p>
                      <p className="text-lg font-bold text-primary">{highscore}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6 bg-card/50 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">{t('profile.changePassword')}</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.passwordMinLength')}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('profile.confirmPassword')}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="btn-duolingo w-full"
            >
              {changingPassword ? `${t('common.loading')}` : t('profile.updatePassword')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}