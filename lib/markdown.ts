/**
 * ===========================================================================
 * LUMEN — a very small Markdown renderer
 * ===========================================================================
 * Resource `body_md` is authored by our own editors and stored in Turso, so it
 * is a known, narrow subset: headings, paragraphs, bullet/numbered lists,
 * blockquotes, fenced callouts and inline **bold** / *italic* / `code`.
 *
 * Shipping react-markdown for that would add ~40 KB to a bundle we are trying
 * to load on a 2G connection in Gulu. This renders the subset we actually use.
 */

export type MdBlock =
  | { type: "h2" | "h3" | "p" | "quote" | "callout"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "checklist"; items: Array<{ text: string; checked: boolean }> };

const HEADING = /^(#{2,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const TASK = /^[-*]\s+\[([ xX])\]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const CALLOUT = /^(?:!!|\+\+)\s?(.*)$/;

/** Splits markdown into blocks the reader can render as React elements. */
export function parseMarkdown(source: string | null | undefined): MdBlock[] {
  if (!source) return [];

  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let buffer: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let tasks: Array<{ text: string; checked: boolean }> | null = null;

  const flushParagraph = () => {
    if (buffer.length === 0) return;
    blocks.push({ type: "p", text: buffer.join(" ").trim() });
    buffer = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items });
    list = null;
  };

  const flushTasks = () => {
    if (!tasks) return;
    blocks.push({ type: "checklist", items: tasks });
    tasks = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      flushTasks();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushTasks();
      blocks.push({
        type: heading[1].length === 2 ? "h2" : "h3",
        text: heading[2].trim(),
      });
      continue;
    }

    const task = TASK.exec(line);
    if (task) {
      flushParagraph();
      flushList();
      tasks ??= [];
      tasks.push({ text: task[2].trim(), checked: task[1].toLowerCase() === "x" });
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      flushTasks();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1].trim());
      continue;
    }

    const numbered = NUMBERED.exec(line);
    if (numbered) {
      flushParagraph();
      flushTasks();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1].trim());
      continue;
    }

    const callout = CALLOUT.exec(line);
    if (callout) {
      flushParagraph();
      flushList();
      flushTasks();
      blocks.push({ type: "callout", text: callout[1].trim() });
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      flushTasks();
      blocks.push({ type: "quote", text: quote[1].trim() });
      continue;
    }

    // A normal text line: keep accumulating into the current paragraph.
    buffer.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTasks();
  return blocks;
}

export type InlineToken = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

/**
 * Splits a line into inline tokens. Handles **bold**, *italic* and `code`,
 * including bold text nested inside a sentence.
 */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index) });
    }
    const chunk = match[0];
    if (chunk.startsWith("**")) {
      tokens.push({ text: chunk.slice(2, -2), bold: true });
    } else if (chunk.startsWith("`")) {
      tokens.push({ text: chunk.slice(1, -1), code: true });
    } else {
      tokens.push({ text: chunk.slice(1, -1), italic: true });
    }
    lastIndex = match.index + chunk.length;
  }

  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ text }];
}

/** Plain-text preview used for card summaries and search results. */
export function toPlainText(source: string | null | undefined, limit = 180): string {
  if (!source) return "";
  const text = source
    .replace(/[#>*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
