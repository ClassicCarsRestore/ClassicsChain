import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldHelpProps {
  text: string;
}

export function FieldHelp({ text }: FieldHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <span className="relative inline-flex ml-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-48 px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-lg"
        >
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>
      )}
    </span>
  );
}
