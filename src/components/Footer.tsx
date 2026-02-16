import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Bug, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { contactService } from '@/services/contactService';
import { useToast } from '@/hooks/use-toast';

const WHATSAPP_NUMBER = '34644566471'; // Replace with actual WhatsApp number

export function Footer() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<{ message: string; debug?: unknown } | null>(null);

  const getCurrentContext = () => {
    const path = location.pathname;
    const search = location.search;
    const params = new URLSearchParams(search);
    const topic = params.get('topic');
    
    let context = `Página: ${path}`;
    if (topic) {
      context += `\nTema: ${topic}`;
    }
    return context;
  };

  const handleReportError = async () => {
    if (!user) {
      toast({
        title: t('contact.loginRequired'),
        variant: 'destructive'
      });
      return;
    }

    if (!errorMessage.trim()) {
      toast({
        title: t('footer.errorMessageRequired'),
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const context = getCurrentContext();
      const fullMessage = `${context}\n\n--- Descripción del error ---\n${errorMessage}`;

      const result = await contactService.sendContactEmail({
        subject: 'Reporte de error en la APP',
        message: fullMessage
      });

      if (result.success) {
        toast({
          title: t('footer.errorReported'),
          description: t('footer.errorReportedDesc')
        });
        setErrorMessage('');
        setErrorDialogOpen(false);
        setSendError(null);
      } else {
        const msg = result.error || t('contact.error');
        setSendError({ message: msg, debug: result.debug });
        toast({
          title: msg,
          variant: 'destructive'
        });
      }
    } catch (error) {
      const err = error as Error;
      setSendError({
        message: t('contact.error'),
        debug: { name: err?.name, message: err?.message, stack: err?.stack },
      });
      toast({
        title: t('contact.error'),
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent('Contacto desde APP 100x100alemán: ');
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <footer className="border-t border-border bg-background/95 backdrop-blur-sm py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorDialogOpen(true)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Bug className="w-4 h-4" />
              {t('footer.reportError')}
            </Button>
            
            <span className="hidden sm:inline text-muted-foreground">•</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsAppContact}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              {t('footer.contactWhatsApp')}
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('footer.reportErrorTitle')}</DialogTitle>
            <DialogDescription>
              {t('footer.reportErrorDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium text-muted-foreground mb-1">{t('footer.currentLocation')}:</p>
              <pre className="whitespace-pre-wrap text-xs">{getCurrentContext()}</pre>
            </div>

            <div className="space-y-2">
              <Label htmlFor="error-message">{t('footer.errorDescription')}</Label>
              <Textarea
                id="error-message"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder={t('footer.errorPlaceholder')}
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {errorMessage.length}/2000
              </p>
            </div>

            {sendError && (
              <Alert className="border-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{sendError.message}</div>
                  {sendError.debug !== undefined && (
                    <details className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Ver traza técnica
                      </summary>
                      <pre className="mt-2 max-h-56 overflow-auto text-xs">
                        {JSON.stringify(sendError.debug, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setErrorDialogOpen(false)}
                disabled={sending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleReportError}
                disabled={sending || !errorMessage.trim()}
              >
                {sending ? t('contact.sending') : t('footer.sendReport')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
