import { Button } from "@/shared/components/ui/button";
import { Plus, Trash2, X, CircleCheck } from "lucide-react";
import type { QuizQuestion } from "@/shared/types";

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

let counter = 0;

const QuizBuilder = ({ questions, onChange }: QuizBuilderProps) => {
  const addQuestion = () => {
    counter += 1;
    onChange([
      ...questions,
      { id: `q_${Date.now()}_${counter}`, text: "", options: ["", ""], correctIndex: 0, points: 1 },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = questions.map((q, i) => (i === index ? { ...q, ...updates } : q));
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length >= 6) return;
    updateQuestion(qIndex, { options: [...q.options, ""] });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    const newCorrect = q.correctIndex === optIndex
      ? 0
      : q.correctIndex > optIndex
        ? q.correctIndex - 1
        : q.correctIndex;
    updateQuestion(qIndex, { options: newOptions, correctIndex: newCorrect });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const q = questions[qIndex];
    const newOptions = q.options.map((o, i) => (i === optIndex ? value : o));
    updateQuestion(qIndex, { options: newOptions });
  };

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Questions ({questions.length})
      </p>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-semibold text-[#64748B] mt-1.5">Q{qIdx + 1}</span>
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                placeholder="Question text"
                className="flex-1 border-b border-gray-300 bg-transparent px-0 pb-1.5 pt-1 text-sm outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={q.points}
                  onChange={(e) => updateQuestion(qIdx, { points: Math.max(1, Number(e.target.value)) })}
                  className="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-center outline-none focus:border-blue-500"
                />
                <span className="text-xs text-[#64748B]">pts</span>
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(qIdx)}
                className="p-1 text-[#94A3B8] hover:text-red-500 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 ml-6">
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIdx, { correctIndex: optIdx })}
                    className="cursor-pointer shrink-0"
                  >
                    <CircleCheck
                      className={`w-4.5 h-4.5 ${
                        q.correctIndex === optIdx
                          ? "text-green-500"
                          : "text-gray-300 hover:text-gray-400"
                      }`}
                    />
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className={`flex-1 rounded border px-2.5 py-1.5 text-sm outline-none transition-colors ${
                      q.correctIndex === optIdx
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIdx, optIdx)}
                      className="p-0.5 text-[#94A3B8] hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="flex items-center gap-1 text-xs text-[#137FEC] hover:text-[#1171d4] ml-6.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addQuestion}
        className="mt-3 w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-1.5" /> Add Question
      </Button>
    </div>
  );
};

export default QuizBuilder;
