import { supabase } from '@/integrations/supabase/client';

export interface ContactEmailRequest {
  subject: string;
  message: string;
}

export interface ContactEmailResponse {
  success: boolean;
  message?: string;
  remaining?: number;
  error?: string;
  rateLimited?: boolean;
  /**
   * Información de depuración (nunca incluye secretos). Útil para diagnosticar fallos al invocar la Edge Function.
   */
  debug?: unknown;
}

export const contactService = {
  async sendContactEmail(data: ContactEmailRequest): Promise<ContactEmailResponse> {
    const { data: result, error } = await supabase.functions.invoke('send-contact-email', {
      body: data
    });

    if (error) {
      // Error “de transporte” al invocar la función (network/CORS/500 sin body parseable, etc.)
      console.error('Error calling send-contact-email:', error);

      const safeDebug = {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status: (error as any)?.context?.status,
        // Algunos errores traen contexto con response/body; lo dejamos tal cual si existe
        context: (error as any)?.context,
      };

      return {
        success: false,
        error: error.message || 'Error al enviar el mensaje',
        debug: safeDebug,
      };
    }

    return result as ContactEmailResponse;
  }
};
