import { useEffect, useRef } from 'react';

/** Progressive enhancement: unobserved content always remains visible. */
export function useScrollMotion() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;

    const targets = new Set<HTMLElement>();
    const mark = (selector: string, motion: string) => {
      root.querySelectorAll<HTMLElement>(selector).forEach(element => {
        element.dataset['scrollMotion'] = motion;
        targets.add(element);
      });
    };
    mark('.hero h1, .section-heading', 'title');
    mark('.hero-description, .section-description', 'fade');
    mark('.hero-product, .performance-preview', 'visual');
    mark('.academy-image', 'image');
    mark('.contact-form, .faq-accordion', 'fade');
    root.querySelectorAll('.ecosystem-grid, .tools-grid, .plans-grid, .benefits-grid, .steps').forEach(group => {
      Array.from(group.children).forEach((child, index) => {
        if (!(child instanceof HTMLElement)) return;
        child.dataset['scrollMotion'] = group.classList.contains('steps') ? 'step' : 'card';
        child.style.setProperty('--reveal-order', String(index));
        targets.add(child);
      });
    });
    mark('.eco-bars, .floating-target .progress-track, .course-progress .progress-track', 'grow');
    mark('#performance .chart', 'chart');
    mark('#performance .metric-value', 'indicator');

    // Only apply animation once the element is actually seen. No pending hidden state,
    // timeout or scroll handler can leave content inaccessible on fast scrolls.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('scroll-seen');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(element => observer.observe(element));
    const stop = () => {
      if (!preference.matches) return;
      observer.disconnect();
      targets.forEach(element => element.classList.remove('scroll-seen'));
    };
    preference.addEventListener('change', stop);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', stop);
      targets.forEach(element => {
        element.classList.remove('scroll-seen');
        delete element.dataset['scrollMotion'];
        element.style.removeProperty('--reveal-order');
      });
    };
  }, []);

  return ref;
}