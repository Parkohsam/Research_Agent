"use client";

type ResearchInputProps = {
  researchTopic: string;
  onResearchTopicChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ResearchInput({
  researchTopic,
  onResearchTopicChange,
  onSubmit,
}: ResearchInputProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-4">
      <textarea
        value={researchTopic}
        onChange={(event) => onResearchTopicChange(event.target.value)}
        placeholder="Describe your research topic or question..."
        rows={4}
        className="w-full resize-none outline-none text-black placeholder:text-black"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <button
          onClick={onSubmit}
          disabled={!researchTopic.trim()}
          className="self-end sm:self-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}