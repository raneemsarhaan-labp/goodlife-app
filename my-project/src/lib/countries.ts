/** Countries offered in the mobile field (Arab countries first). Codes match normalizePhone's list. */
export const COUNTRIES = [
  { code: "966", flag: "🇸🇦", name: "السعودية", zones: ["Asia/Riyadh"] },
  { code: "20", flag: "🇪🇬", name: "مصر", zones: ["Africa/Cairo"] },
  { code: "971", flag: "🇦🇪", name: "الإمارات", zones: ["Asia/Dubai"] },
  { code: "965", flag: "🇰🇼", name: "الكويت", zones: ["Asia/Kuwait"] },
  { code: "974", flag: "🇶🇦", name: "قطر", zones: ["Asia/Qatar"] },
  { code: "973", flag: "🇧🇭", name: "البحرين", zones: ["Asia/Bahrain"] },
  { code: "968", flag: "🇴🇲", name: "عُمان", zones: ["Asia/Muscat"] },
  { code: "962", flag: "🇯🇴", name: "الأردن", zones: ["Asia/Amman"] },
  { code: "970", flag: "🇵🇸", name: "فلسطين", zones: ["Asia/Gaza", "Asia/Hebron"] },
  { code: "961", flag: "🇱🇧", name: "لبنان", zones: ["Asia/Beirut"] },
  { code: "963", flag: "🇸🇾", name: "سوريا", zones: ["Asia/Damascus"] },
  { code: "964", flag: "🇮🇶", name: "العراق", zones: ["Asia/Baghdad"] },
  { code: "967", flag: "🇾🇪", name: "اليمن", zones: ["Asia/Aden"] },
  { code: "249", flag: "🇸🇩", name: "السودان", zones: ["Africa/Khartoum"] },
  { code: "218", flag: "🇱🇾", name: "ليبيا", zones: ["Africa/Tripoli"] },
  { code: "216", flag: "🇹🇳", name: "تونس", zones: ["Africa/Tunis"] },
  { code: "213", flag: "🇩🇿", name: "الجزائر", zones: ["Africa/Algiers"] },
  { code: "212", flag: "🇲🇦", name: "المغرب", zones: ["Africa/Casablanca"] },
  { code: "222", flag: "🇲🇷", name: "موريتانيا", zones: ["Africa/Nouakchott"] },
  { code: "90", flag: "🇹🇷", name: "تركيا", zones: ["Europe/Istanbul"] },
  { code: "44", flag: "🇬🇧", name: "المملكة المتحدة", zones: ["Europe/London"] },
  { code: "1", flag: "🇺🇸", name: "أمريكا وكندا", zones: [] },
] as const;

export const DEFAULT_COUNTRY = "966";

/** The country to preselect for a device time zone (Saudi Arabia otherwise). */
export function countryForZone(zone: string | undefined): string {
  return COUNTRIES.find((c) => (c.zones as readonly string[]).includes(zone ?? ""))?.code ?? DEFAULT_COUNTRY;
}
