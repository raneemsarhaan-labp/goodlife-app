import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../messages/ar.json";
import { formatNumber } from "@/lib/format";

const t = createTranslator({ locale: "ar", messages, namespace: "resources" });
const count = (n: number) => t("count", { count: n, n: formatNumber(n) });

describe("Arabic plural agreement", () => {
  it("uses the right noun form for each number", () => {
    expect(count(0)).toBe("لا عناصر");
    expect(count(1)).toBe("عنصر واحد");
    expect(count(2)).toBe("عنصران");
    expect(count(3)).toBe("٣ عناصر");
    expect(count(11)).toBe("١١ عنصرًا");
    expect(count(100)).toBe("١٠٠ عنصر");
  });
});
