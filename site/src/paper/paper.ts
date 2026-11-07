/** Parse the verbatim 2016 transcription into pages and render it in the paper voice. */
import raw from './transcription.md?raw';

export type BlockType = 'p' | 'caption' | 'figure' | 'image' | 'list' | 'box' | 'footer' | 'title' | 'note';
export interface Block { type: BlockType; text: string; figId?: '1-1' | '1-2' | '2' | '3'; items?: string[] }
export interface Page { id: string; title: string; blocks: Block[] }

const FIG_MATCH: [RegExp, Block['figId']][] = [
  [/Avg\. 24\+ Feet Usage %/, '1-1'],
  [/Avg\. 3P FGM/, '1-2'],
  [/Two heat maps/, '2'],
  [/Scatter plot/, '3'],
];

export function parsePaper(src: string = raw): Page[] {
  const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
  const pages: Page[] = [];
  let cur: Page | null = null;
  let i = 0;
  // skip the appendix header + its explanatory paragraph
  while (i < lines.length && !/^Cover$/.test(lines[i])) i++;
  for (; i < lines.length; i++) {
    const l = lines[i];
    const pageHead = l.match(/^Page (\d+): (.+)$/);
    if (l === 'Cover' || pageHead) {
      cur = { id: l === 'Cover' ? 'cover' : `page-${pageHead![1]}`, title: l === 'Cover' ? 'Cover' : pageHead![2], blocks: [] };
      pages.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^PAGE \d+$/.test(l)) { cur.blocks.push({ type: 'footer', text: l }); continue; }
    if (/^\[Box:/.test(l)) { cur.blocks.push({ type: 'box', text: l.replace(/^\[Box:\s*/, '').replace(/\]\s*/, ' — ').trim() }); continue; }
    if (/^\[/.test(l)) {
      const fig = FIG_MATCH.find(([re]) => re.test(l));
      if (fig) cur.blocks.push({ type: 'figure', text: l.slice(1, -1), figId: fig[1] });
      else cur.blocks.push({ type: 'image', text: l.slice(1, -1) });
      continue;
    }
    if (/^FIGURE \d/.test(l)) { cur.blocks.push({ type: 'caption', text: l }); continue; }
    if (/^Note: /.test(l)) { cur.blocks.push({ type: 'note', text: l }); continue; }
    if (cur.id === 'cover') { cur.blocks.push({ type: 'title', text: l }); continue; }
    if (/^Here is what this study will look at:$/.test(l)) {
      const items: string[] = [];
      while (i + 1 < lines.length && !/^\[|^FIGURE|^Page |^PAGE /.test(lines[i + 1]) && items.length < 4) items.push(lines[++i]);
      cur.blocks.push({ type: 'list', text: l, items });
      continue;
    }
    cur.blocks.push({ type: 'p', text: l });
  }
  return pages;
}

export interface MarginNote { id: string; page: string; anchor: string; text: string }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function withAnchors(text: string, notes: MarginNote[]): string {
  let html = esc(text);
  for (const n of notes) {
    const a = esc(n.anchor);
    if (html.includes(a)) html = html.replace(a, `<mark class="anchor" data-note="${n.id}">${a}</mark>`);
  }
  return html;
}

/**
 * Render one page. Figure blocks become empty mounts (`<div class="fig-mount" data-fig="1-1">`)
 * for the shell to fill with live charts; photos become riso placeholder plates.
 */
export function renderPage(page: Page, notes: MarginNote[]): HTMLElement {
  const sec = document.createElement('section');
  sec.className = 'paper-page';
  sec.id = `paper-${page.id}`;
  const my = notes.filter((n) => n.page === page.id);
  const used = new Set<string>();
  const noteHtml = (n: MarginNote) => `<aside class="margin-note" id="note-${n.id}" data-for="${n.id}">${esc(n.text)}</aside>`;
  const parts: string[] = [];
  if (page.id !== 'cover') parts.push(`<h2 class="paper-h">${esc(page.title)}</h2>`);
  for (const b of page.blocks) {
    const hit = my.filter((n) => !used.has(n.id) && b.text.includes(n.anchor));
    hit.forEach((n) => used.add(n.id));
    const notesHtml = hit.map(noteHtml).join('');
    const wrap = (inner: string) => `<div class="has-notes">${inner}${notesHtml}</div>`;
    switch (b.type) {
      case 'title': {
        const m = b.text.match(/^(The Long Range Game) (A STUDY OF THE THREE POINTER) (.+)$/);
        if (m) parts.push(`<p class="paper-cover-line">${esc(m[1])}</p><p class="paper-cover-sub">${esc(m[2])}</p><p class="paper-cover-by">${esc(m[3])}</p>`);
        else parts.push(`<p class="paper-cover-line">${esc(b.text)}</p>`);
        break;
      }
      case 'p': parts.push(wrap(`<p>${withAnchors(b.text, hit)}</p>`)); break;
      case 'note': parts.push(wrap(`<p class="paper-credit">${withAnchors(b.text, hit)}</p>`)); break;
      case 'caption': parts.push(wrap(`<p class="fig-caption">${withAnchors(b.text, hit)}</p>`)); break;
      case 'list': parts.push(`<p>${esc(b.text)}</p><ul class="paper-list">${(b.items ?? []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`); break;
      case 'figure': parts.push(`<figure class="paper-fig" data-fig="${b.figId}"><div class="fig-mount" data-fig="${b.figId}"></div><figcaption class="sr-only">${esc(b.text)}</figcaption></figure>${notesHtml}`); break;
      case 'image': parts.push(`<figure class="paper-photo" aria-label="Photo not reproduced"><span class="kicker">Photo not reproduced</span><span class="paper-photo__desc">${esc(b.text.replace(/\. Not reusable.*$/, ''))}</span></figure>`); break;
      case 'box': parts.push(wrap(`<div class="paper-box">${withAnchors(b.text, hit)}</div>`)); break;
      case 'footer': parts.push(`<p class="paper-footer">${esc(b.text)}</p>`); break;
    }
  }
  // notes whose anchor text wasn't found still show at the end of the page
  for (const n of my) if (!used.has(n.id)) parts.push(noteHtml(n));
  sec.innerHTML = parts.join('\n');
  return sec;
}
