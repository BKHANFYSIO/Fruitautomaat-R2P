import React, { useState, useCallback } from 'react';

interface InfoTooltipProps {
  children?: React.ReactNode; // content of tooltip OR trigger when asChild=true
  content?: React.ReactNode;  // explicit tooltip content when using asChild
  asChild?: boolean;          // render provided children as trigger instead of default 'i'
  autoCloseMs?: number;       // automatisch verbergen na X ms
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ children, content, asChild = false, autoCloseMs = 3500 }) => {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(v => !v), []);
  const ignoreClickRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (open && autoCloseMs > 0) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setOpen(false), autoCloseMs);
      return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    }
    return undefined;
  }, [open, autoCloseMs]);
  const tooltipContent = asChild ? content : children;
  const trigger = asChild ? children : 'i';
  const titleText = !asChild && typeof children === 'string' ? (children as string) : undefined;
  return (
    <span className="info-tooltip" role="img" aria-label="info"
      title={titleText}
      onMouseEnter={show} onMouseLeave={hide}
      onTouchStart={(e) => { e.preventDefault(); ignoreClickRef.current = true; toggle(); setTimeout(() => { ignoreClickRef.current = false; }, 250); }}
      onClick={() => { if (ignoreClickRef.current) { ignoreClickRef.current = false; return; } toggle(); }}
    >
      {trigger}
      {tooltipContent && (
        <span className="info-tooltip-content" data-open={open ? '1' : undefined} onClick={(e) => { e.stopPropagation(); hide(); }}>{tooltipContent}</span>
      )}
    </span>
  );
};



