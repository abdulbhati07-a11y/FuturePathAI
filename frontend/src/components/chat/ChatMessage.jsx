import { memo } from 'react';
import { Sparkles, User } from 'lucide-react';
import {
  extractOptions,
  stripOptionLines,
  renderMessageBody,
} from './messageFormat';
import './ChatMessage.css';

/**
 * @param {object}   props
 * @param {string}   props.role          - 'assistant' | 'user'
 * @param {string}   props.content       - raw message text (markdown-lite)
 * @param {string}   props.timestamp
 * @param {boolean}  props.isStreaming   - true while this bubble is receiving tokens
 * @param {boolean}  props.showOptions   - render lettered options as tappable chips
 * @param {(text: string) => void} [props.onOptionClick]
 */
function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
  showOptions,
  onOptionClick,
}) {
  const isAI = role === 'assistant';

  // Only parse options once the stream has settled — chips appearing/reflowing
  // mid-stream feels glitchy.
  const options = isAI && showOptions && !isStreaming ? extractOptions(content) : [];
  const body = options.length > 0 ? stripOptionLines(content) : content;

  return (
    <div className={`chat-message ${isAI ? 'chat-message--ai' : 'chat-message--user'}`}>
      {isAI && (
        <span className="chat-message__avatar chat-message__avatar--ai">
          <Sparkles size={14} strokeWidth={2} />
        </span>
      )}

      <div className="chat-message__bubble-col">
        <div className="chat-message__bubble">
          {renderMessageBody(body)}
          {isStreaming && <span className="chat-message__cursor" aria-hidden="true" />}
        </div>

        {options.length > 0 && (
          <div className="chat-message__options" role="group" aria-label="Answer options">
            {options.map((opt) => (
              <button
                key={opt.letter}
                type="button"
                className="chat-message__option-chip"
                onClick={() => onOptionClick?.(opt.text)}
              >
                <span className="chat-message__option-letter">{opt.letter}</span>
                {opt.text}
              </button>
            ))}
          </div>
        )}

        <span className="chat-message__meta">
          {isAI ? 'ADVISOR' : 'YOU'} • {timestamp}
        </span>
      </div>

      {!isAI && (
        <span className="chat-message__avatar chat-message__avatar--user">
          <User size={14} strokeWidth={2} />
        </span>
      )}
    </div>
  );
}

// Memoized: during token-by-token streaming the parent re-renders on every
// token, but only the streaming bubble's `content`/`isStreaming` actually
// change. With a stable `onOptionClick` (see NewSimulationPage), memo lets the
// other bubbles bail out of re-rendering instead of re-rendering the whole list.
export default memo(ChatMessage);
