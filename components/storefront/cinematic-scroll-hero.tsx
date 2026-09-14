"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./cinematic-scroll-hero.module.css";

const ASSET = "/videos/upnsmoke-storefront";
const easeInOutCubic = (p: number) => p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;

/** Paused, serialized seeks: never queue stale scroll positions behind the decoder. */
export function CinematicScrollHero({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const video = videoRef.current;
    if (!scene || !video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chrome = document.querySelector<HTMLElement>(".store-chrome");
    let frame = 0;
    let top = 0;
    let travel = 1;
    let progress = 0;
    let previousTime = 0;
    let failed = false;

    const schedule = () => { if (!frame && !failed) frame = requestAnimationFrame(update); };
    function update(now: number) {
      frame = 0;
      if (!video || motion.matches || failed) return;
      const target = Math.max(0, Math.min(1, (window.scrollY - top) / travel));
      const elapsed = previousTime ? Math.min(now - previousTime, 64) : 16;
      previousTime = now;
      // Exact endpoints prevent a delayed final frame when leaving the pin.
      progress = target === 0 || target === 1 ? target : progress + (target - progress) * (1 - Math.exp(-elapsed / 65));
      if (Math.abs(progress - target) < 0.0001) progress = target;
      if (video.readyState >= 2 && Number.isFinite(video.duration) && !video.seeking) {
        // Seek inside the last sample rather than past the media's final frame.
        const end = Math.max(0, video.duration - 0.001);
        const next = easeInOutCubic(progress) * end;
        if (Math.abs(video.currentTime - next) > 0.008) video.currentTime = next;
      }
      if (progress !== target) schedule();
    }
    const measure = () => {
      const inset = chrome?.getBoundingClientRect().height ?? 0;
      scene.style.setProperty("--chrome-height", `${inset}px`);
      const pin = scene.firstElementChild as HTMLElement;
      top = scene.getBoundingClientRect().top + window.scrollY - inset;
      travel = Math.max(1, scene.offsetHeight - pin.offsetHeight);
      schedule();
    };
    const ready = () => {
      if (video.readyState >= 2) scene.dataset.ready = "true";
      schedule();
    };
    const error = () => { failed = true; scene.dataset.failed = "true"; cancelAnimationFrame(frame); frame = 0; };
    const preference = () => { previousTime = 0; measure(); };
    // No play() call is needed: paused seeking avoids autoplay policy rejections.
    const interact = () => { if (video.readyState === 0 && !failed && !motion.matches) video.load(); schedule(); };
    const resize = new ResizeObserver(measure);
    resize.observe(scene);
    if (chrome) resize.observe(chrome);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("pageshow", measure);
    window.addEventListener("touchstart", interact, { passive: true });
    motion.addEventListener("change", preference);
    video.addEventListener("loadedmetadata", measure);
    video.addEventListener("loadeddata", ready);
    video.addEventListener("canplay", ready);
    video.addEventListener("seeked", schedule);
    video.addEventListener("error", error);
    const source = video.querySelector("source");
    source?.addEventListener("error", error);
    measure();
    ready();
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) error();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      window.removeEventListener("touchstart", interact);
      motion.removeEventListener("change", preference);
      video.removeEventListener("loadedmetadata", measure);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("seeked", schedule);
      video.removeEventListener("error", error);
      source?.removeEventListener("error", error);
    };
  }, []);

  return (
    <section ref={sceneRef} className={styles.scene} aria-label="Inside Up N Smoke Vapors">
      <div className={styles.pin}>
        <div className={styles.visual}>
          <div className={styles.still} aria-hidden="true" />
          <video ref={videoRef} className={styles.video} muted playsInline preload="auto" poster={`${ASSET}-poster.jpg`} disablePictureInPicture disableRemotePlayback aria-hidden="true" tabIndex={-1}>
            <source src={`${ASSET}-walkthrough.mp4`} type="video/mp4" />
          </video>
        </div>
        <p className="sr-only">A walkthrough from the illuminated Up N Smoke Vapors sign through the entrance to the store interior.</p>
        <div className={styles.copy}>{children}</div>
      </div>
    </section>
  );
}
