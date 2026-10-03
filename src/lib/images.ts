function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Passport photo: center-cropped to 5:6 portrait, ~150×180 JPEG (well under 50 KB). */
export async function passportPhoto(file: File): Promise<string> {
  const img = await loadImage(file);
  const W = 150, H = 180, ratio = W / H;
  let sw = img.width, sh = img.height;
  if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  c.getContext("2d")?.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
  return c.toDataURL("image/jpeg", 0.72);
}

/** Keep only dark pen strokes from a photo of a signature on paper; paper becomes transparent. */
export async function extractSignature(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, 600 / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  // Estimate paper brightness (shadows vary) using the 85th percentile of luminance.
  const lum = new Uint8Array(w * h);
  const hist = new Array(256).fill(0);
  for (let i = 0; i < w * h; i++) {
    const l = Math.round(0.299 * px[i * 4]! + 0.587 * px[i * 4 + 1]! + 0.114 * px[i * 4 + 2]!);
    lum[i] = l; hist[l]++;
  }
  let acc = 0, paper = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= w * h * 0.85) { paper = v; break; } }
  const ink = paper * 0.62, soft = paper * 0.8;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < w * h; i++) {
    const l = lum[i]!;
    let a = 0;
    if (l <= ink) a = 255; else if (l < soft) a = Math.round(255 * (soft - l) / (soft - ink));
    const r = px[i * 4]!, b = px[i * 4 + 2]!;
    const blue = b > r + 25;
    px[i * 4] = blue ? 20 : 15; px[i * 4 + 1] = blue ? 40 : 15; px[i * 4 + 2] = blue ? 140 : 20;
    px[i * 4 + 3] = a;
    if (a > 80) { const x = i % w, y = (i / w) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  ctx.putImageData(d, 0, 0);
  if (maxX <= minX || maxY <= minY) return c.toDataURL("image/png");
  const pad = 8;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1; out.height = maxY - minY + 1;
  out.getContext("2d")?.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}
