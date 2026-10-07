export interface Cue {
  start: number;
  end: number;
  text: string;
}

function toSeconds(ts: string): number {
  const parts = ts.trim().replace(",", ".").split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/** Minimal WebVTT parser: cues, multi-line text, basic tag stripping. Ignores NOTE/STYLE blocks. */
export function parseVtt(source: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    const idx = lines.findIndex((l) => l.includes("-->"));
    if (idx === -1 || /^(NOTE|STYLE|REGION)/.test(lines[0])) continue;
    const [a, rest] = lines[idx].split("-->");
    const b = rest.trim().split(/\s+/)[0];
    const text = lines
      .slice(idx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const start = toSeconds(a);
    const end = toSeconds(b);
    if (!Number.isNaN(start) && !Number.isNaN(end) && text) cues.push({ start, end, text });
  }
  return cues.sort((x, y) => x.start - y.start);
}

export function activeCue(cues: Cue[], t: number): Cue | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid];
    if (t < c.start) hi = mid - 1;
    else if (t > c.end) lo = mid + 1;
    else return c;
  }
  return null;
}
