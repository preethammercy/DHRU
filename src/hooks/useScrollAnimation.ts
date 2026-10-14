import { useEffect } from 'react';

/**
 * Custom hook to activate smooth scroll-driven entrance animations
 * using IntersectionObserver. Any element with class `.scroll-animate`
 * will automatically receive `.visible` when scrolled into view.
 */
export function useScrollAnimation(dependencyKey?: any) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once visible, we can unobserve if entrance is one-shot
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-animate:not(.visible)');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [dependencyKey]);
}
