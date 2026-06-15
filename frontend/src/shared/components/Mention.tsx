import { useEffect, useRef, useState } from "react";
import Linkify from "./Linkify";

export type MentionMember = { userId: string; name: string };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Composer input with @-mention autocomplete ─────────────────────────────
// Controlled value; reports the userIds whose @Name still appears in the text.
export function MentionInput({
  value,
  onChange,
  members,
  onMentionsChange,
  onKeyDown,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  members: MentionMember[];
  onMentionsChange: (ids: string[]) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickedRef = useRef<MentionMember[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  // Recompute valid mentions whenever the text changes (drop ones the user deleted)
  useEffect(() => {
    const ids = pickedRef.current
      .filter((p) => value.includes(`@${p.name}`))
      .map((p) => p.userId);
    onMentionsChange([...new Set(ids)]);
  }, [value, onMentionsChange]);

  const candidates =
    query !== null
      ? members
          .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6)
      : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);
    const caret = e.target.selectionStart ?? text.length;
    const m = text.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/);
    if (m) {
      setQuery(m[1]);
      setHighlight(0);
    } else {
      setQuery(null);
    }
  };

  const insertMention = (m: MentionMember) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const atIdx = before.lastIndexOf("@");
    if (atIdx < 0) return;
    const newBefore = before.slice(0, atIdx) + `@${m.name} `;
    const newVal = newBefore + value.slice(caret);
    pickedRef.current = [...pickedRef.current, m];
    onChange(newVal);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(newBefore.length, newBefore.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== null && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % candidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(candidates[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setQuery(null);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {query !== null && candidates.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-56 max-h-44 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-lg z-50 py-1">
          {candidates.map((m, i) => (
            <button
              key={m.userId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer ${
                i === highlight
                  ? "bg-[#E8F4FD] text-[#137FEC]"
                  : "hover:bg-[#F1F5F9] text-[#0F172A]"
              }`}
            >
              @{m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Render text with @Name tokens highlighted (URLs still linkified) ────────
export function MentionText({ text, names }: { text: string | null; names: string[] }) {
  if (!text) return null;
  const sorted = [...new Set(names)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return <Linkify text={text} />;

  const re = new RegExp(`@(${sorted.map(escapeRegex).join("|")})`, "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<Linkify key={last} text={text.slice(last, m.index)} />);
    parts.push(
      <span key={`m${m.index}`} className="text-[#137FEC] font-medium bg-[#137FEC]/10 rounded px-0.5">
        @{m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Linkify key="end" text={text.slice(last)} />);
  return <>{parts}</>;
}
