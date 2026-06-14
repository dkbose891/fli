'use client';

import { useRef, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import type { ParcelRef } from '@/types/nsw';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = [
  "What's the zoning at 1 Martin Place Sydney?",
  'Is this parcel bushfire prone?',
  'Tell me about this block',
];

export default function Chat({
  selectedParcel,
  onAgentLayers,
}: {
  selectedParcel: ParcelRef | null;
  onAgentLayers: (l: Record<string, FeatureCollection>) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const next = [...messages, { role: 'user' as const, text: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, selectedParcel }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
      } else {
        setMessages((m) => [...m, { role: 'model', text: data.reply || '(no reply)' }]);
        onAgentLayers(data.layers ?? {});
      }
    } catch {
      setError('Network error — could not reach the agent.');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <h1>NSW Place Analyser</h1>
        <p>Ask about NSW land parcels — zoning, bushfire, flood, and more.</p>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>Try one of these:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}

        {loading && <div className="bubble model thinking">Thinking…</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {selectedParcel && (
        <div className="parcel-chip">
          Selected: {selectedParcel.lotidstring}
        </div>
      )}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. What's the zoning here?"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>

      <footer className="attribution">
        Cadastre data © State of New South Wales (Spatial Services). CC BY.
      </footer>

      <style jsx>{`
        .chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--panel);
          border-right: 1px solid var(--border);
        }
        .chat-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border);
        }
        .chat-header h1 {
          margin: 0;
          font-size: 17px;
          letter-spacing: 0.2px;
        }
        .chat-header p {
          margin: 4px 0 0;
          font-size: 12.5px;
          color: var(--muted);
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .empty {
          color: var(--muted);
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
        .suggestion {
          background: var(--accent-soft);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .suggestion:hover {
          background: rgba(79, 156, 255, 0.24);
        }
        .bubble {
          max-width: 88%;
          padding: 10px 13px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .bubble.user {
          align-self: flex-end;
          background: var(--user-bubble);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .bubble.model {
          align-self: flex-start;
          background: var(--assistant-bubble);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }
        .thinking {
          color: var(--muted);
          font-style: italic;
        }
        .error {
          align-self: stretch;
          background: rgba(255, 107, 107, 0.12);
          border: 1px solid rgba(255, 107, 107, 0.4);
          color: var(--danger);
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
        }
        .parcel-chip {
          margin: 0 14px 2px;
          padding: 5px 10px;
          background: var(--accent-soft);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 11.5px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .composer {
          display: flex;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid var(--border);
        }
        .composer input {
          flex: 1;
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 13px;
          color: var(--text);
          font-size: 14px;
          outline: none;
        }
        .composer input:focus {
          border-color: var(--accent);
        }
        .composer button {
          background: var(--accent);
          color: #06101f;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          padding: 0 18px;
          font-size: 14px;
          cursor: pointer;
        }
        .composer button:disabled {
          opacity: 0.45;
          cursor: default;
        }
        .attribution {
          padding: 9px 14px;
          font-size: 10.5px;
          color: var(--muted);
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
