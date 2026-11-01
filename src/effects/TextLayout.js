export const SANS = '"Microsoft YaHei UI", "Microsoft YaHei", sans-serif';
export const MONO = 'Consolas, "Cascadia Code", "Microsoft YaHei", monospace';

// 先测量，再排版。允许增行，不让长诗被画布边界吞掉。
export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let row = '';
  for (const char of text) {
    if (char === '\n') { lines.push(row); row = ''; continue; }
    if (row && ctx.measureText(row + char).width > maxWidth) { lines.push(row); row = char; }
    else row += char;
  }
  lines.push(row);
  return lines;
}

export function layoutText(ctx, paragraphs, { size = 34, minSize = 30, maxWidth = 1180, lineHeight = 1.55, font = SANS, maxLines = 4 } = {}) {
  let lines;
  do {
    ctx.font = `${size}px ${font}`;
    lines = paragraphs.flatMap(text => wrapText(ctx, text, maxWidth));
    if (lines.length <= maxLines || size <= minSize) break;
    size--;
  } while (true);
  return { lines, size, font, lineHeight: size * lineHeight, widths: lines.map(line => ctx.measureText(line).width) };
}

/**
 * 同一份字形用于成诗、光迹与心诗变形。
 * 有界 LRU：反复运行与切换诗句不会无限堆积纹理。
 */
export class TextAtlas {
  constructor(limit = 24) { this.cache = new Map(); this.limit = limit; }
  clear() { this.cache.clear(); }
  get(lines, options = {}) {
    const key = JSON.stringify([lines, options]);
    if (this.cache.has(key)) {
      const item = this.cache.get(key); this.cache.delete(key); this.cache.set(key, item); return item;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const layout = layoutText(ctx, lines, options);
    canvas.width = Math.ceil((options.maxWidth || 1180) + 24);
    canvas.height = Math.ceil(layout.lineHeight * (layout.lines.length - 1) + layout.size * 1.65 + 20);
    const center = canvas.width / 2, baseline = layout.size + 10;
    ctx.font = `${layout.size}px ${layout.font}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    layout.lines.forEach((line, i) => ctx.fillText(line, center, baseline + i * layout.lineHeight));
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = image;
    const points = [];
    for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 120) points.push({ x: x - center, y: y - baseline });
    }
    const item = { canvas, layout, points, center, baseline, contours: null, image };
    this.cache.set(key, item);
    while (this.cache.size > this.limit) this.cache.delete(this.cache.keys().next().value);
    return item;
  }
  contours(atlas) {
    if (atlas.contours) return atlas.contours;
    // 沿二值字形边界追踪有向边，包含中文内孔；这是轮廓书写，不冒充真实笔顺。
    const { data, width: w, height: h } = atlas.image;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 120;
    const edges = new Map();
    const vertex = (x, y) => y * (w + 1) + x;
    const add = (x, y, u, v) => { const a = vertex(x,y), b = vertex(u,v); if (!edges.has(a)) edges.set(a, []); edges.get(a).push(b); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid(x,y)) {
      if (!solid(x,y-1)) add(x,y,x+1,y);
      if (!solid(x+1,y)) add(x+1,y,x+1,y+1);
      if (!solid(x,y+1)) add(x+1,y+1,x,y+1);
      if (!solid(x-1,y)) add(x,y+1,x,y);
    }
    const loops = [];
    while (edges.size) {
      const start = edges.keys().next().value; let current = start, loop = [], guard = 0;
      do {
        loop.push({ x: current % (w + 1) - atlas.center, y: Math.floor(current / (w + 1)) - atlas.baseline });
        const next = edges.get(current); if (!next) break;
        const to = next.pop(); if (!next.length) edges.delete(current); current = to;
      } while (current !== start && ++guard < w * h * 4);
      if (loop.length > 5) { loop.push(loop[0]); loops.push(loop); }
    }
    // 按行、按字的轮廓顺序。每条轮廓间抬笔，避免跨字连成粗线。
    loops.sort((a,b) => {
      const rowA = Math.round((a[0].y + atlas.layout.size / 2) / atlas.layout.lineHeight);
      const rowB = Math.round((b[0].y + atlas.layout.size / 2) / atlas.layout.lineHeight);
      return rowA - rowB || a[0].x - b[0].x;
    });
    atlas.contours = loops;
    return loops;
  }
}
