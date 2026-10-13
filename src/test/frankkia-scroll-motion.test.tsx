import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollMotion } from '@/components/frankkia/use-scroll-motion';

function Fixture() {
  const ref = useScrollMotion();
  return <main ref={ref}><h2 className="section-heading">Frankkia</h2></main>;
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Scroll motion lifecycle', () => {
  it('stops observing an element after its first visible entry', () => {
    const unobserve = vi.fn();
    let notify: IntersectionObserverCallback | undefined;
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = vi.fn();
      unobserve = unobserve;
      disconnect = vi.fn();
    });
    const { getByRole } = render(<Fixture />);
    const target = getByRole('heading');
    const entry: IntersectionObserverEntry = {
      isIntersecting: false, target, boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: 0, intersectionRect: target.getBoundingClientRect(), rootBounds: null, time: 0,
    };
    notify?.([entry], {} as IntersectionObserver);
    expect(unobserve).not.toHaveBeenCalled();
    notify?.([{ ...entry, isIntersecting: true, intersectionRatio: 1 }], {} as IntersectionObserver);
    expect(unobserve).toHaveBeenCalledExactlyOnceWith(target);
  });

  it('does not start observation when reduced motion is requested', () => {
    const constructor = vi.fn();
    vi.stubGlobal('IntersectionObserver', constructor);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<Fixture />);
    expect(constructor).not.toHaveBeenCalled();
  });

  it('renders normally if IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { getByRole } = render(<Fixture />);
    expect(getByRole('heading')).toBeVisible();
  });
});