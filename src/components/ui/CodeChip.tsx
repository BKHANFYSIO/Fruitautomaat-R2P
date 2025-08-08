import React from 'react';

interface CodeChipProps {
  command: string;
  label?: string;
}

export const CodeChip: React.FC<CodeChipProps> = ({ command, label }) => {
  const copy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(command).then(() => {
        try {
          window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Gekopieerd!', type: 'succes', timeoutMs: 1500 } }));
        } catch {}
      }).catch(() => {});
    }
  };
  return (
    <div className="codechip" role="group" aria-label={label || 'Command'}>
      <code className="codechip-code">{command}</code>
      <button className="codechip-copy" onClick={copy} aria-label="Kopieer">Kopieer</button>
    </div>
  );
};


