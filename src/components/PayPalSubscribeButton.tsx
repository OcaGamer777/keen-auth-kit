import { useEffect, useRef } from 'react';

const PAYPAL_CLIENT_ID = 'AVyX8gMPQ18KXMIrwf6aIs9eRJ1VKesJ-QYfHF8cWE1vRwZ_sqh9T8KM5M7XdoURqrAkQ7ezLtD3KMwu';
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
        },
        createSubscription: (_data: any, actions: any) => {
          return actions.subscription.create({ plan_id: PLAN_ID });
        },
        onApprove: (data: any) => {
          alert(data.subscriptionID);
        },
      }).render(containerRef.current);
    }).catch((err) => console.error('PayPal SDK error:', err));
  }, []);

  return <div ref={containerRef} className="w-full max-w-[300px] mx-auto" />;
}
