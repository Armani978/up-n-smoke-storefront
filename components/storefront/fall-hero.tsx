"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useState } from "react";
import type { Season } from "@/lib/season";
import styles from "./fall-hero.module.css";

// Fixed tables (not random) so server and client render identical markup.
const EMBERS = [
  [62, 0, 9.5, 3], [70, 1.4, 11, 2], [78, 2.8, 8.5, 3], [84, 0.7, 12, 2], [66, 3.6, 10, 2], [90, 2.1, 9, 3],
  [74, 4.9, 11.5, 2], [58, 5.6, 10.5, 2], [81, 6.3, 9.8, 3], [94, 3.2, 12.5, 2], [68, 7.1, 8.8, 2], [87, 5.1, 10.2, 3],
] as const;
const LEAVES = [
  [8, 0, 17, 1, 0.42], [30, 5, 21, 2, 0.34], [52, 11, 19, 3, 0.3], [20, 15, 23, 1, 0.26],
] as const;

export function FallHero({ season }: { season: Season }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const artwork = `/seasonal/hero-${season}`;

  return (
    <section className={styles.hero} data-season={season} aria-labelledby="fall-hero-title">
      <div className={styles.art} aria-hidden="true">
        <picture className={styles.picture} hidden={failedImage === artwork}>
          <source media="(max-width: 999px)" srcSet={`${artwork}-mobile.avif`} type="image/avif" />
          <source media="(max-width: 999px)" srcSet={`${artwork}-mobile.webp`} type="image/webp" />
          <source media="(max-width: 999px)" srcSet={`${artwork}-mobile.jpg`} />
          <source srcSet={`${artwork}-desktop.avif`} type="image/avif" />
          <source srcSet={`${artwork}-desktop.webp`} type="image/webp" />
          <Image
            className={styles.image}
            src={`${artwork}-desktop.jpg`}
            alt=""
            width={2400}
            height={1200}
            loading="eager"
            fetchPriority="high"
            unoptimized
            onError={() => setFailedImage(artwork)}
          />
        </picture>
        <span className={styles.glow} />
      </div>

      <div className={styles.atmosphere} aria-hidden="true">
        <span className={`${styles.mist} ${styles.mistBack}`} />
        <span className={`${styles.mist} ${styles.mistFront}`} />
        <span className={styles.embers}>
          {EMBERS.map(([x, delay, duration, size], index) => (
            <i key={index} style={{ "--x": `${x}%`, "--delay": `${delay}s`, "--dur": `${duration}s`, "--size": `${size}px` } as CSSProperties} />
          ))}
        </span>
        <span className={styles.leaves}>
          {LEAVES.map(([x, delay, duration, leaf, scale], index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={index} src={`/seasonal/leaf-${leaf}.svg`} alt="" width={140} height={160} loading="lazy" decoding="async"
              style={{ "--x": `${x}%`, "--delay": `${delay}s`, "--dur": `${duration}s`, "--scale": scale } as CSSProperties} />
          ))}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <span className={styles.label}><i aria-hidden="true" /> HALLOWEEN → HARVEST</span>
          <h1 id="fall-hero-title" className={styles.headline} aria-label="Fall After Dark">
            <span className={styles.line}><span>FALL</span></span>
            <span className={styles.line}><span>AFTER DARK</span></span>
          </h1>
          <p className={styles.copy}>Your local pickup.<br />A little more atmosphere.</p>
          <Link href="/menu" className={styles.cta}>SHOP THE MENU <ArrowUpRight aria-hidden="true" /></Link>
          <span className={styles.note}>MANCHESTER, NH <span aria-hidden="true"> / </span> 21+ · VALID ID AT PICKUP</span>
        </div>
      </div>
      <span className={styles.edition} aria-hidden="true">{season === "harvest" ? "THE HARVEST EDITION" : "THE AFTER DARK EDITION"}</span>
    </section>
  );
}
