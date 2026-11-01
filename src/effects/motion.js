// 运动都可以由时间重新求得：暂停不是近似，重逢不靠随机。
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const mix = (from, to, amount) => from + (to - from) * amount;
export const hash = seed => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function decodeFrame(text, source, seconds, duration = 3.2) {
  if (seconds <= 0) return source;
  if (seconds >= duration) return text;
  const symbols = '01{}<>;/*+=∞';
  const progress = clamp(seconds / duration);
  const locked = Math.floor(progress * text.length);
  const tick = Math.floor(seconds * 9); // 九次/秒的细微扰动，不做闪屏。
  const length = Math.round(mix(source.length, text.length, progress));
  return Array.from({ length }, (_, i) => {
    if (i < locked) return text[i] || '';
    if (progress < .25 && hash(i + tick * 17) > progress * 3) return source[i] || ' ';
    return symbols[Math.floor(hash(i * 13 + tick) * symbols.length)];
  }).join('');
}
