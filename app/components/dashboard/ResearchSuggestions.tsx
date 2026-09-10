"use client";

const suggestions = [
  "Find recent papers on AI-enabled food sensors",
  "Compare research on biosensors and food safety",
  "Find research gaps in AI-based food monitoring",
  "Show me the strongest papers from 2024 onward",
];

type ResearchSuggestionsProps = {
  onSelect: (suggestion: string) => void;
};

export default function ResearchSuggestions({
  onSelect,
}: ResearchSuggestionsProps) {
  return (
    <div className="mt-6">
      <p className="text-sm text-black mb-3">
        Try asking:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition"
          >
            <p className="text-sm text-black">
              {suggestion}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}