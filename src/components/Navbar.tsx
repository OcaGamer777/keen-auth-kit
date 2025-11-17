import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Home, Trophy, User, Shield, LogOut, Sun, Moon, Languages } from 'lucide-react';
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
          LernDeutsch
        </Link>
        
        {/* Controls - Right */}
        <div className="flex items-center gap-2">
          {/* User Menu or Login Button */}
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-2 hidden md:flex">
                <Link to={`/${getTopicParam()}`}><Home className="w-4 h-4" /><span className="hidden lg:inline">{t('nav.home')}</span></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-2 hidden md:flex">
                <Link to={`/ranking${getTopicParam()}`}><Trophy className="w-4 h-4" /><span className="hidden lg:inline">{t('nav.ranking')}</span></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-2 hidden md:flex">
                <Link to={`/profile${getTopicParam()}`}><User className="w-4 h-4" /><span className="hidden lg:inline">{t('nav.profile')}</span></Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild className="gap-2 text-destructive hidden md:flex">
                  <Link to={`/admin${getTopicParam()}`}><Shield className="w-4 h-4" /><span className="hidden lg:inline">{t('nav.admin')}</span></Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 hidden md:flex">
                <LogOut className="w-4 h-4" /><span className="hidden lg:inline">{t('nav.logout')}</span>
              </Button>
              
              {/* Mobile User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem asChild>
                    <Link to={`/${getTopicParam()}`} className="cursor-pointer"><Home className="w-4 h-4 mr-2" />{t('nav.home')}</Link>
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
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/auth"><User className="w-4 h-4" /><span className="hidden sm:inline">{t('nav.login')}</span></Link>
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="gap-2"
            title={t('theme.toggle')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Languages className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'es' ? 'ES' : 'DE'}</span>
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
