"use client";

import { FormEvent } from "react";

type ResearchInputProps = {
    topic: string;
    setTopic: (value: string) => void;
    onSubmit: () => void;
    loading: boolean;
};

export default function ResearchInput({
    topic,
    setTopic,
    onSubmit,
    loading,
}: ResearchInputProps) {
    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!topic.trim() || loading) {
            return;
        }

        onSubmit();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
            <label
                htmlFor="research-topic"
                className="mb-2 block text-sm font-medium text-gray-800"
            >
                What would you like to research?
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    id="research-topic"
                    type="text"
                    value={topic}
                    onChange={(event) =>
                        setTopic(event.target.value)
                    }
                    placeholder="e.g. Artificial intelligence in food safety"
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                <button
                    type="submit"
                    disabled={!topic.trim() || loading}
                    className="self-start rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            <p className="mt-2 text-xs text-gray-500">
                Enter a clear academic topic to discover relevant
                research papers.
            </p>
        </form>
    );
}