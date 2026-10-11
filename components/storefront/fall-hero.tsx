"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Season } from "@/lib/season";
import styles from "./fall-hero.module.css";

export function FallHero({ season }: { season: Season }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const artwork = `/seasonal/hero-${season}`;

  return (
    <section className={styles.hero} data-season={season} aria-labelledby="fall-hero-title">
      <div className={styles.art} aria-hidden="true">
        <picture hidden={failedImage === artwork}>
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
      </div>
      <div className={styles.content}>
        <span className={styles.label}><i aria-hidden="true" /> HALLOWEEN → HARVEST</span>
        <h1 id="fall-hero-title" className={styles.headline} aria-label="Fall After Dark">
          <span>FALL</span>
          <span>AFTER DARK</span>
        </h1>
        <p className={styles.copy}>Your local pickup.<br />A little more atmosphere.</p>
        <Link href="/menu" className={styles.cta}>SHOP THE MENU <ArrowUpRight aria-hidden="true" /></Link>
        <span className={styles.note}>MANCHESTER, NH <span aria-hidden="true"> / </span> 21+ · VALID ID AT PICKUP</span>
      </div>
      <span className={styles.edition} aria-hidden="true">{season === "harvest" ? "THE HARVEST EDITION" : "THE AFTER DARK EDITION"}</span>
    </section>
  );
}
