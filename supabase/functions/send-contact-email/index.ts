// send-contact-email v2.1 — force redeploy
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Rate limiting: max 5 emails per hour per user
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ContactEmailRequest {
  subject: string;
  message: string;
}

// Simple in-memory rate limiter (resets on function cold start, but provides basic protection)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || (now - userLimit.windowStart) > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

// Input validation
function validateInput(
  data: unknown,
): { valid: true; data: ContactEmailRequest } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const { subject, message } = data as Record<string, unknown>;

  if (typeof subject !== "string" || subject.trim().length === 0) {
    return { valid: false, error: "Subject is required" };
  }

  if (subject.length > 200) {
    return { valid: false, error: "Subject must be less than 200 characters" };
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return { valid: false, error: "Message is required" };
  }

  if (message.length > 5000) {
    return { valid: false, error: "Message must be less than 5000 characters" };
  }

  return {
    valid: true,
    data: {
      subject: subject.trim(),
      message: message.trim(),
    },
  };
}

// Send email using Resend API directly via fetch
async function sendEmailWithResend(params: {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string; status?: number }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      reply_to: params.replyTo,
      subject: params.subject,
      html: params.html,
    }),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    console.error("Resend API error:", { status: response.status, data });
    return {
      success: false,
      status: response.status,
      error: data?.message || "Failed to send email",
    };
  }

  return { success: true, id: data?.id };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let step = "start";

  try {
    // 1. Verify authentication
    step = "auth_header";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, {
        error: "Debes iniciar sesión para enviar un mensaje",
        debug: { step },
      });
    }

    step = "get_user";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(401, {
        error: "Sesión inválida. Por favor inicia sesión de nuevo",
        debug: { step, userError: userError?.message },
      });
    }

    const userId = user.id;
    const userEmail = user.email || "unknown@email.com";

    // 2. Check rate limit
    step = "rate_limit";
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return jsonResponse(429, {
        error: "Has alcanzado el límite de mensajes. Intenta de nuevo en 1 hora",
        rateLimited: true,
        debug: { step },
      });
    }

    // 3. Validate input
    step = "parse_body";
    const body = await req.json();

    step = "validate_input";
    const validation = validateInput(body);

    if (!validation.valid) {
      return jsonResponse(400, {
        error: validation.error,
        debug: { step },
      });
    }

    const { subject, message } = validation.data;

    // 4. Get contact email from app_config (fixed recipient - not user-configurable)
    step = "load_config";
    const { data: configData, error: configError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "contact_email")
      .single();

    if (configError) {
      console.error("Error fetching app_config.contact_email:", configError);
    }

    const contactEmail = configData?.value as string;

    if (!contactEmail) {
      console.error("Contact email not configured in app_config");
      return jsonResponse(500, {
        error: "El sistema de contacto no está configurado",
        debug: { step },
      });
    }

    // 5. Send email via Resend API
    step = "send_email";
    const emailResult = await sendEmailWithResend({
      // IMPORTANTE: este dominio debe estar verificado en Resend
      from: "Contacto <contacto@soporte.100x100aleman.es>",
      to: [contactEmail],
      replyTo: userEmail,
      subject: `[Contacto] ${subject}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>De:</strong> ${userEmail}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <hr />
        <p><strong>Mensaje:</strong></p>
        <div style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${message}
        </div>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Este mensaje fue enviado desde la app de aprendizaje de alemán.
          Usuario ID: ${userId}
        </p>
      `,
    });

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      return jsonResponse(500, {
        error: "Error al enviar el email. Intenta de nuevo más tarde",
        debug: {
          step,
          resendStatus: emailResult.status,
          resendError: emailResult.error,
        },
      });
    }

    // 6. Log the email attempt (audit trail)
    step = "audit_log";
    console.log("Contact email sent:", {
      userId,
      userEmail,
      subject: subject.substring(0, 50),
      timestamp: new Date().toISOString(),
      resendId: emailResult.id,
    });

    step = "done";
    return jsonResponse(200, {
      success: true,
      message: "Tu mensaje ha sido enviado correctamente",
      remaining: rateCheck.remaining,
      debug: { step },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error in send-contact-email:", { step, err });
    return jsonResponse(500, {
      error: "Error al enviar el mensaje. Intenta de nuevo más tarde",
      debug: {
        step,
        name: err?.name,
        message: err?.message,
      },
    });
  }
});
