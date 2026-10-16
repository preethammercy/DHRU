import { useEffect } from 'react';

/**
 * Custom hook to activate smooth scroll-driven entrance animations
 * using IntersectionObserver and MutationObserver.
 * Dynamically added elements (e.g., after async API responses) are
 * automatically observed and made visible.
 */
export function useScrollAnimation(dependencyKey?: any) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-animate').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '50px 0px 50px 0px',
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll('.scroll-animate:not(.visible)');
      elements.forEach((el) => observer.observe(el));
    };

    // Initial observe
    observeElements();

    // Use MutationObserver so newly mounted items are immediately observed
    let mutationObserver: MutationObserver | null = null;
    if ('MutationObserver' in window) {
      mutationObserver = new MutationObserver(() => {
        observeElements();
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Safety timeout: ensure everything is visible even if observer fails
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('.scroll-animate:not(.visible)').forEach((el) => {
        el.classList.add('visible');
      });
    }, 400);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
      mutationObserver?.disconnect();
    };
  }, [dependencyKey]);
}
