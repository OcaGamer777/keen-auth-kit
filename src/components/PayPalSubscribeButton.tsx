import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const PAYPAL_CLIENT_ID = 'sb'; // Sandbox mode – change back to production ID when done testing
const PLAN_ID = 'P-2SG07300U6287153VNGNWHRY';

let sdkPromise: Promise<void> | null = null;

function loadPayPalSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  if ((window as any).paypal) return Promise.resolve();

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.setAttribute('data-sdk-integration-source', 'button-factory');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function PayPalSubscribeButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current) return;

    loadPayPalSdk().then(() => {
      if (!containerRef.current || renderedRef.current) return;
      renderedRef.current = true;

      const paypal = (window as any).paypal;
      paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'blue',
          layout: 'horizontal',
          label: 'subscribe',
          tagline: false,
        },
        createSubscription: (_data: any, actions: any) => {
          return actions.subscription.create({ plan_id: PLAN_ID });
        },
        onApprove: () => {
          toast.success('¡Pago recibido! 🎉', {
            description: 'Una vez verificado el pago, en menos de 24h se activará tu suscripción PRO en la aplicación.',
            duration: 15000,
          });
        },
      }).render(containerRef.current);
    }).catch((err) => console.error('PayPal SDK error:', err));
  }, []);

  return <div ref={containerRef} className="w-full max-w-[300px] mx-auto [&_iframe]:!rounded-full [&_iframe]:!overflow-hidden dark:[&_iframe]:!bg-transparent" style={{ colorScheme: 'light' }} />;
}
