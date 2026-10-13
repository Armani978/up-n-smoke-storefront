import Image from "next/image";
import Link from "next/link";
import styles from "./promotional-hero.module.css";

const HERO_IMAGE = "/promos/zour-dream-mushroom-gummies-hero.png";

export function PromotionalHero() {
  return (
    <section className={styles.hero} aria-labelledby="zour-dream-hero-title">
      <h1 id="zour-dream-hero-title" className="sr-only">
        Zour Dream mushroom gummies
      </h1>
      <Link
        className={styles.link}
        href="/menu"
        aria-label="Shop Zour Dream mushroom gummies"
      >
        <Image
          className={styles.image}
          src={HERO_IMAGE}
          alt="Zour Dream mushroom gummies in Sour Grape, Sour Green Apple, Rainbow Drip, and Orange Dreamsicle flavors, advertised for $7.99"
          width={1536}
          height={1024}
          priority
          unoptimized
          sizes="100vw"
        />
      </Link>
    </section>
  );
}
