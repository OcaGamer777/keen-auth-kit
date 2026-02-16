import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { supabase } from '@/integrations/supabase/client';
import { useSound } from '@/contexts/SoundContext';
import { Button } from './ui/button';
import { Trophy, User, Shield, LogOut, Sun, Moon, Languages, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { getTopicParam } = useTopic();
  const { soundEnabled, setSoundEnabled } = useSound();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({ title: t('nav.logout') });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl bg-background/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Left */}
        <Link to={`/${getTopicParam()}`} className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          100x100alemán
        </Link>
        
        {/* Controls - Right */}
        <div className="flex items-center gap-0">
          {/* User Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to={`/levels${getTopicParam()}`} className="cursor-pointer"><Trophy className="w-4 h-4 mr-2" />{t('nav.levels')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/ranking${getTopicParam()}`} className="cursor-pointer"><Trophy className="w-4 h-4 mr-2" />{t('nav.ranking')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/profile${getTopicParam()}`} className="cursor-pointer"><User className="w-4 h-4 mr-2" />{t('nav.profile')}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to={`/admin${getTopicParam()}`} className="cursor-pointer text-destructive"><Shield className="w-4 h-4 mr-2" />{t('nav.admin')}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />{t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/auth"><User className="w-4 h-4" /></Link>
            </Button>
          )}

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={t('theme.toggle')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => setLanguage('es')} className="cursor-pointer">
                🇪🇸 {t('lang.spanish')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('de')} className="cursor-pointer">
                🇩🇪 {t('lang.german')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
