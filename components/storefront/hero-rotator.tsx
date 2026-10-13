"use client";

import { Pause, Play } from "lucide-react";
import { Children, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

const ROTATION_MS = 8000;
// Must outlast --dur-slide in fall-after-dark.css so a leaving slide finishes
// fading before it snaps back to its ready position.
const SETTLE_MS = 1000;
const SWIPE_PX = 48;

export function HeroRotator({ labels, children }: { labels: string[]; children: ReactNode }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const stage = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ index: 0, previous: -1 });
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    const sync = () => { setReducedMotion(motion.matches); setFinePointer(pointer.matches); };
    sync();
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    return () => { motion.removeEventListener("change", sync); pointer.removeEventListener("change", sync); };
  }, []);

  // Atmosphere animations pause while the hero is scrolled out of view.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const show = useCallback((next: number) => {
    setPosition((current) => {
      const target = ((next % count) + count) % count;
      return target === current.index ? current : { index: target, previous: current.index };
    });
  }, [count]);

  const rotating = count > 1 && !paused && !engaged && !reducedMotion;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => show(position.index + 1), ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [rotating, show, position.index]);

  useEffect(() => {
    if (position.previous < 0) return;
    const timer = window.setTimeout(() => setPosition((current) => ({ ...current, previous: -1 })), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [position]);

  // Pointer parallax: publishes --px/--py in -1..1 for the depth layers to read.
  const setParallax = (x: number, y: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      stage.current?.style.setProperty("--px", x.toFixed(3));
      stage.current?.style.setProperty("--py", y.toFixed(3));
    });
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!finePointer || reducedMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setParallax(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };
  const onPointerLeave = () => { setEngaged(false); setParallax(0, 0); };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || count < 2) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) show(position.index + (dx < 0 ? 1 : -1));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (count < 2) return;
    if (event.key === "ArrowRight") { event.preventDefault(); show(position.index + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(position.index - 1); }
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false);
  };

  return (
    <section
      ref={stage}
      className="hero-rotator"
      data-inview={inView ? "true" : "false"}
      aria-roledescription="carousel"
      aria-label="Homepage highlights"
      onMouseEnter={() => setEngaged(true)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { swipe.current = null; }}
      onFocus={() => setEngaged(true)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <div className="hero-rotator-stage" aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, index) => {
          const active = index === position.index;
          const state = active ? "active" : index === position.previous ? "leaving" : "inactive";
          return (
            <div
              key={index}
              className="hero-slide"
              data-state={state}
              role="group"
              aria-roledescription="slide"
              aria-label={`${labels[index] ?? `Slide ${index + 1}`} (${index + 1} of ${count})`}
              aria-hidden={!active}
              inert={!active}
            >
              {slide}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="hero-rotator-controls">
          <button type="button" onClick={() => setPaused((current) => !current)} aria-pressed={paused} aria-label={paused ? "Resume rotation" : "Pause rotation"}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <div role="group" aria-label="Choose highlight">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === position.index ? "is-active" : ""}
                aria-label={`Show ${labels[index] ?? `slide ${index + 1}`}`}
                aria-current={index === position.index ? "true" : undefined}
                onClick={() => show(index)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
