import React, { useEffect, useRef, useState } from 'react';
import { Festival } from '../types/Festival';

interface CustomOverlayRendererProps {
  festival: Festival | null;
  className?: string;
}

export const CustomOverlayRenderer: React.FC<CustomOverlayRendererProps> = ({
  festival,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!festival?.style.assets.customOverlayCode || !containerRef.current) {
      setIsLoaded(false);
      return;
    }

    try {
      const customCode = festival.style.assets.customOverlayCode;
      const container = containerRef.current;
      
      // Clear previous content
      container.innerHTML = '';
      setError(null);

      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = customCode;

      // Extract and inject styles
      const styleElements = tempDiv.querySelectorAll('style');
      styleElements.forEach((styleEl, index) => {
        const newStyle = document.createElement('style');
        newStyle.textContent = styleEl.textContent;
        newStyle.setAttribute('data-festival-overlay', `${festival.id}-${index}`);
        document.head.appendChild(newStyle);
      });

      // Extract and inject scripts
      const scriptElements = tempDiv.querySelectorAll('script');
      const scriptsToExecute: string[] = [];
      
      scriptElements.forEach((scriptEl) => {
        if (scriptEl.src) {
          // External script
          const newScript = document.createElement('script');
          newScript.src = scriptEl.src;
          newScript.setAttribute('data-festival-overlay', festival.id);
          document.head.appendChild(newScript);
        } else if (scriptEl.textContent) {
          // Inline script - collect for later execution
          scriptsToExecute.push(scriptEl.textContent);
        }
      });

      // Remove style and script elements from temp div
      tempDiv.querySelectorAll('style, script').forEach(el => el.remove());

      // Inject the remaining HTML
      container.innerHTML = tempDiv.innerHTML;

      // Execute inline scripts in a safe context
      scriptsToExecute.forEach((scriptContent, index) => {
        try {
          // Wrap script in a function to avoid global scope pollution
          const wrappedScript = `
            (function() {
              const container = document.querySelector('[data-festival-container="${festival.id}"]');
              ${scriptContent}
            })();
          `;
          
          const scriptElement = document.createElement('script');
          scriptElement.textContent = wrappedScript;
          scriptElement.setAttribute('data-festival-overlay', `${festival.id}-script-${index}`);
          document.body.appendChild(scriptElement);
        } catch (scriptError) {
          console.error('Error executing custom overlay script:', scriptError);
        }
      });

      setIsLoaded(true);
    } catch (err) {
      console.error('Error rendering custom overlay:', err);
      setError('Failed to render custom overlay code');
      setIsLoaded(false);
    }

    // Cleanup function
    return () => {
      // Remove injected styles
      document.querySelectorAll(`[data-festival-overlay^="${festival.id}"]`).forEach(el => {
        el.remove();
      });
    };
  }, [festival?.style.assets.customOverlayCode, festival?.id]);

  if (!festival?.style.assets.customOverlayCode) {
    return null;
  }

  if (error) {
    return (
      <div className="custom-overlay-error">
        <p>Custom overlay error: {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`custom-overlay-container ${className}`}
      data-festival-container={festival.id}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default CustomOverlayRenderer;