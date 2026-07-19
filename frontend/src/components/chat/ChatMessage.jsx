import { Sparkles, User } from 'lucide-react';
import './ChatMessage.css';

export default function ChatMessage({ role, content, timestamp, isStreaming }) {
  const isAI = role === 'assistant';

  return (
    <div className={`chat-message ${isAI ? 'chat-message--ai' : 'chat-message--user'}`}>
      {isAI && (
        <span className="chat-message__avatar chat-message__avatar--ai">
          <Sparkles size={14} strokeWidth={2} />
        </span>
      )}

      <div className="chat-message__bubble-col">
        <div className="chat-message__bubble">
          {content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
          {isStreaming && <span className="chat-message__cursor" aria-hidden="true" />}
        </div>
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
