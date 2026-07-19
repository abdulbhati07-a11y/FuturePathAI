import { useState } from 'react';
import { Mic, ArrowUp } from 'lucide-react';
import './ChatComposer.css';

export default function ChatComposer({ suggestions, onSend, disabled }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <div className="chat-composer">
      {suggestions && suggestions.length > 0 && (
        <div className="chat-composer__suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="chat-composer__chip"
              disabled={disabled}
              onClick={() => onSend(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="chat-composer__bar" onSubmit={handleSubmit}>
        <button type="button" className="chat-composer__mic" aria-label="Voice input (coming soon)" disabled={disabled} title="Voice input — coming soon">
          <Mic size={16} strokeWidth={2} />
        </button>
        <input
          type="text"
          className="chat-composer__input"
          placeholder="Type your response..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
        />
        <button type="submit" className="chat-composer__send" disabled={disabled || !value.trim()}>
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
