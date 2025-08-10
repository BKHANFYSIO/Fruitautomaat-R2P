import React from 'react';

interface InfoTooltipProps {
  children: React.ReactNode;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ children }) => {
  return (
    <span className="info-tooltip" role="img" aria-label="info" title={typeof children === 'string' ? children : undefined}>
      i
      {typeof children !== 'string' && (
        <span className="info-tooltip-content">{children}</span>
      )}
    </span>
  );
};



