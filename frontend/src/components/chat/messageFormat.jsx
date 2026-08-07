/**
 * messageFormat — shared helpers for rendering AI chat messages.
 *
 * The advisor's replies use a small, predictable subset of markdown
 * (**bold**, bullet lists) and end questions with lettered options
 * ("A) Under 3 months"). We render that subset ourselves as React elements —
 * no HTML strings involved, so no sanitizer needed.
 */

/**
 * Extract lettered answer options from an AI message.
 * Matches lines like "A) Under 3 months" / "B. 3–6 months".
 * @returns {Array<{ letter: string, text: string }>}
 */
export function extractOptions(content) {
  if (!content) return [];
  const matches = Array.from(
    content.matchAll(/^\s*([A-F])[).]\s+(.{1,80}?)\s*$/gm),
    (m) => ({ letter: m[1], text: m[2].replace(/\*\*/g, '') }),
  );
  // Require at least 2 options so a stray "A) …" in prose doesn't trigger chips
  return matches.length >= 2 ? matches : [];
}

/** Remove the lettered-option lines from a message (they render as chips instead). */
export function stripOptionLines(content) {
  if (!content) return content;
  return content
    .replace(/^\s*[A-F][).]\s+.{1,80}?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/** Render **bold** segments of a single line as React elements. */
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

/**
 * Render a chat message body (markdown-lite) as React elements.
 * Supports paragraphs, **bold**, and -/* bullet lists.
 */
export function renderMessageBody(content) {
  const lines = (content || '').split('\n');
  const blocks = [];
  let listItems = null;

  const flushList = (key) => {
    if (listItems && listItems.length > 0) {
      blocks.push(
        <ul className="chat-message__list" key={`ul_${key}`}>
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
    }
    listItems = null;
  };

  lines.forEach((line, i) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!listItems) listItems = [];
      listItems.push(bullet[1]);
      return;
    }
    flushList(i);
    blocks.push(<p key={i}>{line ? renderInline(line) : ' '}</p>);
  });
  flushList('end');

  return blocks;
}
