import React from 'react';

type Props = {
  isMobieleWeergave: boolean;
  isScoreLadeOpen: boolean;
  setIsScoreLadeOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  onToggleFullscreen: () => void;
};

export const MobileControls: React.FC<Props> = ({
  isMobieleWeergave,
  isScoreLadeOpen,
  setIsScoreLadeOpen,
  onToggleFullscreen,
}) => {
  if (!isMobieleWeergave) return null;
  return (
    <>
      <button className="score-lade-knop" onClick={() => setIsScoreLadeOpen((prev: boolean) => !prev)}>
        <div className="hamburger-menu">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </div>
      </button>
      <button className="fullscreen-knop" onClick={onToggleFullscreen}>
        ⛶
      </button>
      <div
        className={`score-lade-overlay ${isScoreLadeOpen ? 'open' : ''}`}
        onClick={() => setIsScoreLadeOpen(false)}
      ></div>
    </>
  );
};


