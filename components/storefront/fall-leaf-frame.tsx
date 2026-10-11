import Image from "next/image";

export function FallLeafFrame() {
  return (
    <div className="fall-leaf-frame" aria-hidden="true">
      {[1, 2, 3].map((leaf) => <Image key={leaf} className={`fall-leaf fall-leaf-${leaf}`} src={`/seasonal/leaf-${leaf}.svg`} alt="" width={140} height={160} />)}
    </div>
  );
}
