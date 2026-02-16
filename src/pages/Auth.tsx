import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { rankingService } from '@/services/rankingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

const signUpSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(30, 'El nombre de usuario debe tener máximo 30 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePendingScore(session.user.id);
      }
    });
  }, [navigate]);

  const handlePendingScore = async (userId: string) => {
    // Check for pending score from localStorage
    const pendingScoreStr = localStorage.getItem('pendingScore');
    if (pendingScoreStr) {
      try {
        const { level, score } = JSON.parse(pendingScoreStr);
        await rankingService.submitScore(level, score);
        localStorage.removeItem('pendingScore');
        toast({
          title: t('game.resultSaved'),
          description: t('game.scoreSaved').replace('{score}', score),
        });
      } catch (error) {
        console.error('Error saving pending score:', error);
      }
    }
    
    const returnTo = searchParams.get('returnTo') || '/';
    navigate(returnTo);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = signUpSchema.parse({
        username,
        email,
        password,
      });

      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: validatedData.username,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast({
            title: t('auth.error'),
            description: t('auth.emailRegistered'),
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed') || error.message.includes('confirmation')) {
          toast({
            title: t('auth.emailNotConfirmed'),
            description: t('auth.checkEmailConfirmation'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.error'),
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        // Check if user was auto-confirmed (email confirmation disabled)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is auto-confirmed, redirect to app
          toast({
            title: t('auth.signupSuccess'),
            description: t('auth.loginSuccess'),
          });
          await handlePendingScore(session.user.id);
        } else {
          // User needs to verify email - show success and switch to login view
          toast({
            title: t('auth.signupSuccess'),
            description: t('auth.verifyEmail'),
          });
          setIsSignUp(false);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('auth.validationError'),
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = signInSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        toast({
          title: t('auth.error'),
          description: error.message === 'Invalid login credentials' 
            ? t('auth.error')
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.loginSuccess'),
        });
        
        // Get session to retrieve user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handlePendingScore(session.user.id);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('auth.validationError'),
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: t('auth.validationError'),
        description: t('auth.email'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });

      if (error) {
        toast({
          title: t('auth.error'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: t('auth.resetEmailSent'),
          description: t('auth.resetEmailSentDesc'),
        });
      }
    } catch (error) {
      toast({
        title: t('auth.error'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="backdrop-blur-xl bg-card/50 border border-border rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent mb-2">
              {isForgotPassword ? t('auth.resetPassword') : isSignUp ? t('auth.signup') : t('auth.login')}
            </h1>
            <p className="text-muted-foreground">
              {isForgotPassword
                ? t('auth.forgotPassword')
                : isSignUp ? t('auth.noAccount') : t('auth.hasAccount')}
            </p>
          </div>

          {/* Forgot Password View */}
          {isForgotPassword ? (
            resetEmailSent ? (
              <div className="text-center space-y-4 animate-slide-up">
                <div className="text-5xl mb-4">📧</div>
                <p className="text-muted-foreground">{t('auth.resetEmailSentDesc')}</p>
                <Button
                  onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }}
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                >
                  {t('auth.backToLogin')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <Label htmlFor="reset-email" className="text-foreground">{t('auth.email')}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border focus:border-primary transition-all duration-300"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl animate-slide-up"
                  style={{ animationDelay: '0.2s' }}
                >
                  {loading ? t('common.loading') : t('auth.resetPassword')}
                </Button>

                <div className="text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Login / Signup View */
            <>
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Label htmlFor="username" className="text-foreground">{t('auth.username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="tu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-background/50 border-border focus:border-primary transition-all duration-300"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border focus:border-primary transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-border focus:border-primary transition-all duration-300 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link - only on login */}
                {!isSignUp && (
                  <div className="text-right animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl animate-slide-up"
                  style={{ animationDelay: '0.6s' }}
                >
                  {loading ? t('common.loading') : isSignUp ? t('auth.signup') : t('auth.login')}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}
                  <span className="text-primary font-semibold">
                    {isSignUp ? t('auth.login') : t('auth.signup')}
                  </span>
                </button>
                
                <p className="text-sm text-muted-foreground bg-primary/10 border border-primary/20 rounded-lg p-3">
                  {t('auth.signupBenefit')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
