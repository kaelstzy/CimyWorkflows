"use client";

import type { Message, MessageRole } from "@/types/conversation";

interface MessageEditorProps {
  messages: Message[];
  onChange: (messages: Message[]) => void;
}

function otherRole(role: MessageRole): MessageRole {
  return role === "user" ? "assistant" : "user";
}

export function MessageEditor({ messages, onChange }: MessageEditorProps) {
  function updateMessage(index: number, patch: Partial<Message>) {
    const next = messages.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeMessage(index: number) {
    onChange(messages.filter((_, i) => i !== index));
  }

  function addMessage() {
    const lastRole = messages[messages.length - 1]?.role;
    const nextRole: MessageRole = lastRole ? otherRole(lastRole) : "user";
    onChange([...messages, { role: nextRole, content: "" }]);
  }

  function moveMessage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= messages.length) return;
    const next = messages.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <div
          key={index}
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex overflow-hidden rounded-md border border-neutral-700">
              {(["user", "assistant"] as MessageRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateMessage(index, { role })}
                  className={
                    "px-3 py-1 text-xs font-semibold uppercase tracking-wide transition " +
                    (message.role === role
                      ? role === "user"
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-violet-500/20 text-violet-300"
                      : "text-neutral-500 hover:text-neutral-300")
                  }
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveMessage(index, -1)}
                disabled={index === 0}
                className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveMessage(index, 1)}
                disabled={index === messages.length - 1}
                className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeMessage(index)}
                disabled={messages.length <= 1}
                className="rounded px-2 py-1 text-xs text-red-400/80 hover:text-red-400 disabled:opacity-30"
                aria-label="Remove message"
              >
                Remove
              </button>
            </div>
          </div>

          <textarea
            value={message.content}
            onChange={(e) => updateMessage(index, { content: e.target.value })}
            placeholder={message.role === "user" ? "What the user says…" : "How the assistant responds…"}
            rows={3}
            className="w-full resize-y rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addMessage}
        className="w-full rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200"
      >
        + Add message
      </button>
    </div>
  );
}
