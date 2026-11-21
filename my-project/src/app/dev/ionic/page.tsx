import { notFound } from "next/navigation";
import { IonicShowcaseClientOnly } from "./ClientOnly";

export const metadata = { robots: { index: false } };

/** Development-only showcase of Ionic components (not available in production builds). */
export default function IonicShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <IonicShowcaseClientOnly />;
}
