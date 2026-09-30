"use client";

type ResearchSuggestionsProps = {
    onSelectSuggestion: (suggestion: string) => void;
};

const suggestions = [
    "Artificial intelligence in food quality and safety",
    "Machine learning applications in healthcare",
    "Artificial intelligence in agriculture",
    "Climate change and sustainable development",
    "Blockchain technology in financial services",
];

export default function ResearchSuggestions({
    onSelectSuggestion,
}: ResearchSuggestionsProps) {
    return (
        <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
                Research topic suggestions
            </h2>

            <div className="flex flex-wrap gap-3">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                            onSelectSuggestion(suggestion)
                        }
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm text-gray-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}