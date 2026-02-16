import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const prevValue = React.useRef(value || 0);
  const [shootingStar, setShootingStar] = React.useState(false);

  React.useEffect(() => {
    if ((value || 0) > prevValue.current) {
      setShootingStar(true);
      const t = setTimeout(() => setShootingStar(false), 700);
      return () => clearTimeout(t);
    }
    prevValue.current = value || 0;
  }, [value]);

  React.useEffect(() => {
    prevValue.current = value || 0;
  }, [value]);

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary rounded-full relative"
          style={{
            transform: `translateX(-${100 - (value || 0)}%)`,
            transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Shooting star streak */}
          {shootingStar && (
            <span
              className="absolute top-0 right-0 h-full w-8 pointer-events-none"
              style={{
                animation: 'shooting-star 0.7s ease-out forwards',
              }}
            >
              <span
                className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary-foreground)) 0%, hsl(var(--primary) / 0.8) 40%, transparent 70%)',
                  boxShadow: '0 0 12px 4px hsl(var(--primary) / 0.8), 0 0 24px 8px hsl(var(--primary) / 0.4)',
                }}
              />
              <span
                className="absolute top-1/2 right-3 -translate-y-1/2 h-1 rounded-full"
                style={{
                  width: '40px',
                  background: 'linear-gradient(to left, hsl(var(--primary-foreground) / 0.9), transparent)',
                }}
              />
            </span>
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>

      {/* Glow halo outside overflow-hidden */}
      {shootingStar && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full pointer-events-none"
          style={{
            left: `${value || 0}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)',
            boxShadow: '0 0 20px 8px hsl(var(--primary) / 0.5)',
            animation: 'glow-fade 0.7s ease-out forwards',
          }}
        />
      )}

      <style>{`
        @keyframes shooting-star {
          0% {
            transform: translateX(-200%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateX(0%);
            opacity: 0;
          }
        }
        @keyframes glow-fade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `}</style>
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
