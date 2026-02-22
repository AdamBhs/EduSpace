export const PasswordPopover = ({
  password,
  show,
}: {
  password: string;
  show: boolean;
}) => {
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const allValid = Object.values(passwordRules).every(Boolean);

  if (!show || allValid) return null;

  const rules = [
    { key: "length", label: "At least 8 characters" },
    { key: "uppercase", label: "One uppercase letter" },
    { key: "lowercase", label: "One lowercase letter" },
    { key: "number", label: "One number" },
    { key: "symbol", label: "One special character" },
  ];

  return (
    <div
      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 w-52 bg-[#0d1b2a] border border-[#253246] rounded-lg shadow-2xl p-4"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      {/* Arrow pointing left */}
      <div className="absolute -left-1.75 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0d1b2a] border-l border-b border-[#253246] rotate-45" />

      <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">
        Password must have
      </p>
      <div className="space-y-1.5">
        {rules.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                passwordRules[key as keyof typeof passwordRules]
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {passwordRules[key as keyof typeof passwordRules] ? "✓" : "✗"}
            </span>
            <span
              className={`text-xs ${
                passwordRules[key as keyof typeof passwordRules]
                  ? "text-green-400"
                  : "text-[#94A3B8]"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </div>
  );
};
