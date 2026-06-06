import { useState, useEffect } from "react";

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function parseISOLocal(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const [datePart, timePart] = iso.split("T");
  if (!datePart) return { date: "", time: "" };
  const [y, m, d] = datePart.split("-");
  return {
    date: d && m && y ? `${d}/${m}/${y}` : "",
    time: timePart?.slice(0, 5) ?? "",
  };
}

function toISOLocal(date: string, time: string): string {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const t = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  return `${y}-${m}-${d}T${t}`;
}

const DateTimeInput = ({ value, onChange, className = "" }: DateTimeInputProps) => {
  const parsed = parseISOLocal(value);
  const [date, setDate] = useState(parsed.date);
  const [time, setTime] = useState(parsed.time);

  useEffect(() => {
    const p = parseISOLocal(value);
    setDate(p.date);
    setTime(p.time);
  }, [value]);

  const handleDateChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    setDate(formatted);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
      const iso = toISOLocal(formatted, time || "00:00");
      if (iso) onChange(iso);
    }
  };

  const handleTimeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 4; i++) {
      if (i === 2) formatted += ":";
      formatted += digits[i];
    }
    setTime(formatted);
    if (/^\d{2}:\d{2}$/.test(formatted) && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const iso = toISOLocal(date, formatted);
      if (iso) onChange(iso);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <input
        type="text"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        placeholder="DD/MM/YYYY"
        maxLength={10}
        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
      <input
        type="text"
        value={time}
        onChange={(e) => handleTimeChange(e.target.value)}
        placeholder="HH:MM"
        maxLength={5}
        className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
};

export default DateTimeInput;
