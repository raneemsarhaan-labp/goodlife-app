import { LinkSession } from "./LinkSession";

/**
 * The frame of the entry screens (sign-in, sign-up, welcome, «رحلة البداية»): a full-height flex
 * column that centres its page at every width (src/ui/theme/auth.css › Shell). Development previews
 * render the same frame.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="au-shell">
      <LinkSession />
      {children}
    </div>
  );
}
