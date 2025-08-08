import React, { useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // On open: store last focused element and move focus into the modal
    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="search"]:not([disabled])',
      'input[type="email"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const focusFirstElement = () => {
      if (!contentRef.current) return;
      const focusables = Array.from(contentRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      const target = focusables.find(el => el.offsetParent !== null) || contentRef.current;
      target.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!contentRef.current) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(contentRef.current.querySelectorAll<HTMLElement>(focusableSelector))
          .filter(el => el.offsetParent !== null);
        if (focusables.length === 0) {
          e.preventDefault();
          contentRef.current.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!current || current === first || !contentRef.current.contains(current)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!current || current === last || !contentRef.current.contains(current)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    focusFirstElement();
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore focus to previously focused element
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        ref={contentRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close-button" aria-label="Sluiten">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}; 