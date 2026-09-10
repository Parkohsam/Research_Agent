"use client";

import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import ResearchInput from "../components/dashboard/ResearchInput";
import ResearchSuggestions from "../components/dashboard/ResearchSuggestions";

type Research = {
    id: string;
    title: string;
    papers: number;
};

const initialResearch: Research[] = [
    {
        id: "food-sensors",
        title: "AI-enabled food sensors",
        papers: 15,
    },
    {
        id: "healthcare",
        title: "AI in healthcare",
        papers: 12,
    },
    {
        id: "renewable-energy",
        title: "Renewable energy",
        papers: 15,
    },
];

export default function DashboardPage() {
    const [researchList, setResearchList] =
        useState<Research[]>(initialResearch);

    const [researchTopic, setResearchTopic] = useState("");
    const [submittedTopic, setSubmittedTopic] = useState("");

    const [currentResearch, setCurrentResearch] =
        useState<Research | null>(null);

    function handleNewResearch() {
        setResearchTopic("");
        setSubmittedTopic("");
        setCurrentResearch(null);
    }

    function handleSelectResearch(research: Research) {
        setCurrentResearch(research);

        setResearchTopic("");
        setSubmittedTopic(research.title);
    }

    function handleSubmit() {
        if (!researchTopic.trim()) {
            return;
        }

        setSubmittedTopic(researchTopic);

        const newResearch: Research = {
            id: Date.now().toString(),
            title: researchTopic,
            papers: 0,
        };

        setResearchList((previousResearch) => [
            newResearch,
            ...previousResearch,
        ]);

        setCurrentResearch(newResearch);
        setResearchTopic("");
    }

    return (
        <main className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                researchList={researchList}
                onNewResearch={handleNewResearch}
                onSelectResearch={handleSelectResearch}
            />

            {/* Main workspace */}
            <section className="flex-1 min-w-0 min-h-0 flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 shrink-0 bg-white border-b border-gray-200 flex items-center px-6 md:px-8">
                    <h2 className="font-semibold text-black ml-12 md:ml-0">
                        {currentResearch
                            ? currentResearch.title
                            : "New Research"}
                    </h2>
                </header>

                {/* Workspace */}
                <div className="min-h-0 flex-1 flex flex-col items-center px-4 sm:px-6 py-10 overflow-y-auto">
                    <div className="w-full max-w-3xl">

                        {/* New research state */}
                        {!submittedTopic && (
                            <div className="text-center mb-10 mt-10">
                                <h1 className="text-3xl sm:text-4xl font-bold text-black">
                                    What are you researching?
                                </h1>

                                <p className="mt-4 text-black text-base sm:text-lg">
                                    Ask ResearchAI to discover and evaluate academic
                                    literature.
                                </p>
                            </div>
                        )}

                        {/* Submitted research */}
                        {submittedTopic && (
                            <div className="mb-8">
                                <div className="flex justify-end">
                                    <div className="max-w-xl bg-indigo-600 text-white rounded-2xl rounded-br-md px-5 py-3">
                                        <p>{submittedTopic}</p>
                                    </div>
                                </div>

                                {/* Temporary processing message */}
                                <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5">
                                    <p className="text-sm font-medium text-black">
                                        ResearchAI
                                    </p>

                                    <p className="mt-2 text-sm text-black">
                                        Ready to search and evaluate academic literature.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Research input */}
                        <ResearchInput
                            researchTopic={researchTopic}
                            onResearchTopicChange={setResearchTopic}
                            onSubmit={handleSubmit}
                        />

                        {/* Suggestions */}
                        {!submittedTopic && (
                            <ResearchSuggestions
                                onSelect={setResearchTopic}
                            />
                        )}

                    </div>
                </div>
            </section>
        </main>
    );
}