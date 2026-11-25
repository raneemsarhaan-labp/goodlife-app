import type { Ref } from "react";

/**
 * The entry screens' header, as «خطتي» draws its own: a kicker (the app's name), the title, one line
 * of intro, and the logo at the other end. Plain markup, so client forms and server pages share it.
 */
export function AuthHeader({ kicker, title, intro, headingRef }: { kicker: string; title: string; intro?: React.ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <header className="au-head">
      <div className="au-head-text">
        <p className="au-kicker">{kicker}</p>
        <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="au-title">
          {title}
        </h1>
        {intro && <p className="au-intro">{intro}</p>}
      </div>
      <span className="au-logo">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative 56px logo, as on «يومك» */}
        <img src="/design/logo.webp" alt="" width={56} height={56} />
      </span>
    </header>
  );
}
