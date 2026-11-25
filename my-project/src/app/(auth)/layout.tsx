import { AuthShell } from "@/components/features/auth/AuthShell";

/** Joining, signing in, the welcome and «رحلة البداية»: one centred column (AuthShell). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
