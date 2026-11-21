import type { Locator, Page } from "@playwright/test";

/** WCAG relative luminance of an sRGB colour (0–255 channels). */
export function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: [number, number, number], b: [number, number, number]) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

function parseRgb(css: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = (css.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b];
}

/**
 * Worst-case contrast of `text` against the pixels actually rendered behind it: the text is made
 * transparent, the box is screenshotted, and the text colour is compared with the lightest and
 * darkest background pixels (so a busy glass background counts at its worst point).
 */
export async function renderedContrast(page: Page, text: Locator): Promise<number> {
  const color = parseRgb(await text.evaluate((el) => getComputedStyle(el).color));
  await text.evaluate((el) => ((el as HTMLElement).style.color = "transparent"));
  const png = await text.screenshot({ animations: "disabled" });
  await text.evaluate((el) => ((el as HTMLElement).style.color = ""));
  const pixels = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    const out: [number, number, number][] = [];
    const step = Math.max(4, Math.floor(data.length / 4 / 400)) * 4;
    for (let i = 0; i < data.length; i += step) out.push([data[i]!, data[i + 1]!, data[i + 2]!]);
    return out;
  }, png.toString("base64"));
  return Math.min(...pixels.map((p) => contrastRatio(color, p)));
}
