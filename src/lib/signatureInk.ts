/** Remove neutral paper/shadows without recolouring the original ink. */
export function inkOpacity(r: number, g: number, b: number, paper: number): number {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const dark = paper * 0.62;
  const soft = paper * 0.8;
  const neutral = Math.max(0, Math.min(1, (soft - luminance) / Math.max(1, soft - dark)));
  const coloured = chroma > 25 ? Math.min(1, (chroma - 25) / 55) : 0;
  return Math.round(255 * Math.max(neutral, coloured));
}