import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { contactService } from '@/services/contactService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const contactSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'El asunto es obligatorio')
    .max(200, 'El asunto debe tener menos de 200 caracteres'),
  message: z
    .string()
    .trim()
    .min(1, 'El mensaje es obligatorio')
    .max(5000, 'El mensaje debe tener menos de 5000 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; remaining?: number; debug?: unknown } | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (!user) {
      setResult({
        type: 'error',
        message: 'Debes iniciar sesión para enviar un mensaje',
        debug: { step: 'no_user' },
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await contactService.sendContactEmail({
        subject: data.subject,
        message: data.message,
      });

      if (response.success) {
        setResult({
          type: 'success',
          message: response.message || 'Tu mensaje ha sido enviado correctamente',
          remaining: response.remaining,
          debug: response.debug,
        });
        form.reset();
      } else {
        setResult({
          type: 'error',
          message: response.error || 'Error al enviar el mensaje',
          debug: response.debug,
        });
      }
    } catch (error) {
      const err = error as Error;
      setResult({
        type: 'error',
        message: 'Error inesperado. Intenta de nuevo más tarde',
        debug: { name: err?.name, message: err?.message, stack: err?.stack },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Debes iniciar sesión para enviar un mensaje de contacto.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contacto
        </CardTitle>
        <CardDescription>
          Envíanos tus dudas, sugerencias o comentarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert className={`mb-4 ${result.type === 'success' ? 'border-primary/50' : 'border-destructive'}`}>
            {result.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={result.type === 'success' ? 'text-foreground' : 'text-destructive'}>
              {result.message}
              {result.remaining !== undefined && result.type === 'success' && (
                <span className="block text-sm text-muted-foreground mt-1">
                  Te quedan {result.remaining} mensajes disponibles esta hora
                </span>
              )}

              {result.debug !== undefined && (
                <details className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Ver traza técnica
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto text-xs">
                    {JSON.stringify(result.debug, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="¿De qué quieres hablarnos?" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Escribe tu mensaje aquí..."
                      className="min-h-[150px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Máximo 5 mensajes por hora para evitar spam
        </p>
      </CardContent>
    </Card>
  );
}
