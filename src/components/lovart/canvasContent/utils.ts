import { CanvasElement } from "@/components/lovart/CanvasArea";

export function findNonOverlappingSpot(
  existing: CanvasElement[],
  itemWidth: number,
  itemHeight: number,
  baseX: number,
  baseY: number,
  gap: number = 40,
): { x: number; y: number } {
  const isOverlapping = (x: number, y: number) =>
    existing.some((el) => {
      const elW = el.width ?? itemWidth;
      const elH = el.height ?? itemHeight;
      return !(
        x + itemWidth + gap <= el.x ||
        x >= el.x + elW + gap ||
        y + itemHeight + gap <= el.y ||
        y >= el.y + elH + gap
      );
    });

  const maxCols = 5;
  let offset = 0;
  while (offset < 1000) {
    const col = offset % maxCols;
    const row = Math.floor(offset / maxCols);
    const x = baseX + col * (itemWidth + gap);
    const y = baseY + row * (itemHeight + gap);
    if (!isOverlapping(x, y)) return { x, y };
    offset++;
  }
  return { x: baseX, y: baseY };
}
