'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50 });

    const xToRing = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const yToRing = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });

    const xToDot = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' });
    const yToDot = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      xToRing(e.clientX);
      yToRing(e.clientY);
      xToDot(e.clientX);
      yToDot(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        gsap.to(ring, { scale: 1.5, borderColor: 'rgba(99, 102, 241, 0.8)', duration: 0.2 });
        gsap.to(dot, { scale: 0.5, backgroundColor: 'rgba(99, 102, 241, 0.8)', duration: 0.2 });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        gsap.to(ring, { scale: 1.0, borderColor: 'rgba(255, 255, 255, 0.3)', duration: 0.2 });
        gsap.to(dot, { scale: 1.0, backgroundColor: '#6366F1', duration: 0.2 });
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-[#6366F1] rounded-full pointer-events-none z-50 hidden md:block"
        style={{ mixBlendMode: 'difference' }}
      />
      <div
        ref={cursorRingRef}
        className="fixed top-0 left-0 w-8 h-8 border border-white/30 rounded-full pointer-events-none z-50 hidden md:block"
        style={{ transition: 'border-color 0.2s, transform 0.1s' }}
      />
    </>
  );
}
