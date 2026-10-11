const message = "LOCAL PICKUP ✦ FALL AFTER DARK ✦ MANCHESTER, NH ✦ 21+ ID REQUIRED ✦";

export function FallMarquee() {
  return (
    <div className="fall-marquee">
      <p className="sr-only">Local pickup. Fall After Dark. Manchester, NH. 21+ ID required.</p>
      <div className="fall-marquee-band" aria-hidden="true">
        <div className="fall-marquee-track">
          {[0, 1].map((group) => (
            <div className="fall-marquee-group" key={group}>
              {[0, 1].map((copy) => <span key={copy}>{message}</span>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
