"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../components/dashboard/Sidebar";
import ResearchInput from "../components/dashboard/ResearchInput";
import ResearchSuggestions from "../components/dashboard/ResearchSuggestions";

import {
    getCurrentUser,
    getMyResearch,
    getResearchPapers,
    createResearch,
    searchResearchPapers,
    deleteResearch,
    analyzePaper,
    type Research,
    type Paper,
} from "@/lib/graphql";

export default function DashboardPage() {
    const router = useRouter();

    const [researchList, setResearchList] =
        useState<Research[]>([]);

    const [currentResearch, setCurrentResearch] =
        useState<Research | null>(null);

    const [papers, setPapers] = useState<Paper[]>([]);

    const [topic, setTopic] = useState("");

    const [submittedTopic, setSubmittedTopic] =
        useState("");

    const [userName, setUserName] =
        useState("");

    const [topicError, setTopicError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [papersLoading, setPapersLoading] =
        useState(false);

    const [papersFound, setPapersFound] =
        useState(0);

    const [analyzingPaperId, setAnalyzingPaperId] =
        useState<string | null>(null);

    const [aiError, setAiError] =
        useState("");

    /* ---------------------------------- */
    /* Load User and Research History     */
    /* ---------------------------------- */

    useEffect(() => {
        const loadDashboard = async () => {
            const token =
                localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const userResponse =
                    await getCurrentUser(token);

                setUserName(
                    userResponse.me.name
                );

                const researchResponse =
                    await getMyResearch(token);

                setResearchList(
                    researchResponse.myResearch
                );
            } catch (error) {
                console.error(
                    "Failed to load dashboard:",
                    error
                );

                localStorage.removeItem("token");
                router.push("/login");
            }
        };

        loadDashboard();
    }, [router]);

    /* ---------------------------------- */
    /* New Research                       */
    /* ---------------------------------- */

    const handleNewResearch = () => {
        setCurrentResearch(null);
        setPapers([]);
        setPapersFound(0);
        setTopic("");
        setSubmittedTopic("");
        setTopicError("");
        setAiError("");
        setAnalyzingPaperId(null);
    };

    /* ---------------------------------- */
    /* Select Existing Research           */
    /* ---------------------------------- */

    const handleSelectResearch = async (
        research: Research
    ) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        setCurrentResearch(research);
        setSubmittedTopic(research.title);
        setTopicError("");
        setAiError("");
        setPapersLoading(true);
        setAnalyzingPaperId(null);

        try {
            const response =
                await getResearchPapers(
                    research.id,
                    token
                );

            setPapers(
                response.researchPapers
            );

            setPapersFound(
                response.researchPapers.length
            );
        } catch (error) {
            console.error(
                "Failed to load research papers:",
                error
            );

            setTopicError(
                error instanceof Error
                    ? error.message
                    : "Failed to load research papers."
            );
        } finally {
            setPapersLoading(false);
        }
    };

    /* ---------------------------------- */
    /* Submit New Research                */
    /* ---------------------------------- */

    const handleSubmit = async () => {
        const trimmedTopic =
            topic.trim();

        if (!trimmedTopic) {
            setTopicError(
                "Please enter an academic research topic."
            );
            return;
        }

        const normalizedTopic =
            trimmedTopic
                .toLowerCase()
                .replace(/[!?.,]+$/g, "")
                .trim();

        const conversationalMessages = [
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening",
            "how are you",
            "how are you doing",
            "thanks",
            "thank you",
            "help",
        ];

        if (
            conversationalMessages.includes(
                normalizedTopic
            )
        ) {
            setTopicError(
                "Please enter an academic research topic, not a greeting or ordinary message."
            );
            return;
        }

        if (trimmedTopic.length < 8) {
            setTopicError(
                "Please enter a more descriptive research topic."
            );
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        setTopicError("");
        setAiError("");
        setPapers([]);
        setPapersFound(0);
        setCurrentResearch(null);
        setSubmittedTopic(trimmedTopic);

        try {
            const researchResponse =
                await createResearch(
                    trimmedTopic,
                    token
                );

            const newResearch =
                researchResponse.createResearch;

            setCurrentResearch(
                newResearch
            );

            const searchResponse =
                await searchResearchPapers(
                    newResearch.id,
                    token
                );

            setPapersFound(
                searchResponse
                    .searchResearchPapers
                    .totalFound
            );

            const papersResponse =
                await getResearchPapers(
                    newResearch.id,
                    token
                );

            setPapers(
                papersResponse.researchPapers
            );

            const updatedResearchResponse =
                await getMyResearch(token);

            setResearchList(
                updatedResearchResponse.myResearch
            );
        } catch (error) {
            console.error(
                "Failed to create research:",
                error
            );

            setTopicError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while creating your research."
            );
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------- */
    /* Analyze Paper With AI              */
    /* ---------------------------------- */

    const handleAnalyzePaper = async (
        paper: Paper
    ) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        if (!paper.abstract?.trim()) {
            setAiError(
                "This paper does not have an abstract available for AI analysis."
            );
            return;
        }

        try {
            setAnalyzingPaperId(
                paper.id
            );

            setAiError("");

            const response =
                await analyzePaper(
                    paper.id,
                    token
                );

            const analysis =
                response.analyzePaper;

            setPapers((previousPapers) =>
                previousPapers.map(
                    (currentPaper) =>
                        currentPaper.id ===
                        paper.id
                            ? {
                                  ...currentPaper,

                                  aiScore:
                                      analysis.score,

                                  aiSummary:
                                      analysis.summary,

                                  aiRelevance:
                                      analysis.relevance,

                                  aiKeyFindings:
                                      analysis.keyFindings,

                                  aiMethodology:
                                      analysis.methodology,

                                  aiAnalyzedAt:
                                      new Date().toISOString(),

                                  evaluationStatus:
                                      analysis.score >=
                                      80
                                          ? "recommended"
                                          : analysis.score >=
                                            60
                                          ? "candidate"
                                          : "rejected",
                              }
                            : currentPaper
                )
            );
        } catch (error) {
            console.error(
                "Failed to analyze paper:",
                error
            );

            setAiError(
                error instanceof Error
                    ? error.message
                    : "Unable to analyze this paper with AI."
            );
        } finally {
            setAnalyzingPaperId(null);
        }
    };

    /* ---------------------------------- */
    /* Delete Research                    */
    /* ---------------------------------- */

    const handleDeleteResearch = async (
        research: Research
    ) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            await deleteResearch(
                research.id,
                token
            );

            setResearchList(
                (previousResearch) =>
                    previousResearch.filter(
                        (item) =>
                            item.id !==
                            research.id
                    )
            );

            if (
                currentResearch &&
                currentResearch.id ===
                    research.id
            ) {
                setCurrentResearch(null);
                setPapers([]);
                setPapersFound(0);
                setSubmittedTopic("");
                setTopic("");
            }

            setTopicError("");
            setAiError("");
        } catch (error) {
            console.error(
                "Failed to delete research:",
                error
            );

            setTopicError(
                error instanceof Error
                    ? error.message
                    : "Failed to delete research."
            );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                researchList={researchList}
                onNewResearch={
                    handleNewResearch
                }
                onSelectResearch={
                    handleSelectResearch
                }
                onDeleteResearch={
                    handleDeleteResearch
                }
                userName={userName}
            />

            <main className="flex-1">
                {/* Header */}
                <header className="border-b border-gray-200 bg-white px-8 py-5">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {currentResearch
                            ? currentResearch.title
                            : "New Research"}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Discover and explore
                        academic research papers
                        with AI-powered analysis.
                    </p>
                </header>

                <div className="mx-auto max-w-5xl px-8 py-8">
                    {/* Submitted Topic */}
                    {submittedTopic && (
                        <div className="mb-6">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                Research topic
                            </p>

                            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
                                {submittedTopic}
                            </div>
                        </div>
                    )}

                    {/* Research Error */}
                    {topicError && (
                        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <span>⚠️</span>
                            <p>{topicError}</p>
                        </div>
                    )}

                    {/* AI Error */}
                    {aiError && (
                        <div className="mb-5 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                            <span>⚠️</span>
                            <p>{aiError}</p>
                        </div>
                    )}

                    {/* Research Input */}
                    <ResearchInput
                        topic={topic}
                        setTopic={(
                            value: string
                        ) => {
                            setTopic(value);
                            setTopicError("");
                            setAiError("");
                        }}
                        onSubmit={
                            handleSubmit
                        }
                        loading={loading}
                    />

                    {/* Suggestions */}
                    {!submittedTopic && (
                        <ResearchSuggestions
                            onSelectSuggestion={(
                                suggestion: string
                            ) => {
                                setTopic(
                                    suggestion
                                );
                                setTopicError("");
                            }}
                        />
                    )}

                    {/* Loading State */}
                    {papersLoading && (
                        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-center">
                            <p className="text-sm text-gray-600">
                                Loading research
                                papers...
                            </p>
                        </div>
                    )}

                    {/* Papers Section */}
                    {!papersLoading &&
                        submittedTopic && (
                            <section className="mt-8">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Research Papers
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {
                                                papersFound
                                            }{" "}
                                            papers
                                            found
                                        </p>
                                    </div>
                                </div>

                                {papers.length ===
                                0 ? (
                                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                                        <p className="text-sm text-gray-600">
                                            No research
                                            papers
                                            found for
                                            this topic.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {papers.map(
                                            (
                                                paper
                                            ) => (
                                                <article
                                                    key={
                                                        paper.id
                                                    }
                                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                                                >
                                                    {/* Paper Header */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <h3 className="text-base font-semibold text-gray-900">
                                                                {
                                                                    paper.title
                                                                }
                                                            </h3>

                                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                {paper.publicationYear && (
                                                                    <span>
                                                                        Published:{" "}
                                                                        {
                                                                            paper.publicationYear
                                                                        }
                                                                    </span>
                                                                )}

                                                                <span>
                                                                    Citations:{" "}
                                                                    {
                                                                        paper.citationCount
                                                                    }
                                                                </span>

                                                                {paper.journal && (
                                                                    <span>
                                                                        {
                                                                            paper.journal
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                                            {paper.isOpenAccess && (
                                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                                    Open
                                                                    Access
                                                                </span>
                                                            )}

                                                            {paper.aiScore !==
                                                                null &&
                                                                paper.aiScore !==
                                                                    undefined && (
                                                                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                                        AI
                                                                        Score:{" "}
                                                                        {Math.round(
                                                                            paper.aiScore
                                                                        )}
                                                                        /100
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>

                                                    {/* Authors */}
                                                    {paper.authors
                                                        .length >
                                                        0 && (
                                                        <p className="mt-4 text-sm text-gray-600">
                                                            <span className="font-medium">
                                                                Authors:
                                                            </span>{" "}
                                                            {paper.authors.join(
                                                                ", "
                                                            )}
                                                        </p>
                                                    )}

                                                    {/* Abstract */}
                                                    {paper.abstract && (
                                                        <div className="mt-4">
                                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                Abstract
                                                            </p>

                                                            <p className="line-clamp-4 text-sm leading-6 text-gray-700">
                                                                {
                                                                    paper.abstract
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="mt-5 flex flex-wrap items-center gap-3">
                                                        {paper.sourceUrl && (
                                                            <a
                                                                href={
                                                                    paper.sourceUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                                                            >
                                                                View
                                                                Paper
                                                            </a>
                                                        )}

                                                        {paper.doi && (
                                                            <a
                                                                href={
                                                                    paper.doi.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? paper.doi
                                                                        : `https://doi.org/${paper.doi}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                            >
                                                                View
                                                                DOI
                                                            </a>
                                                        )}

                                                        {paper.abstract && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleAnalyzePaper(
                                                                        paper
                                                                    )
                                                                }
                                                                disabled={
                                                                    analyzingPaperId ===
                                                                    paper.id
                                                                }
                                                                className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {analyzingPaperId ===
                                                                paper.id
                                                                    ? "Analyzing..."
                                                                    : paper.aiScore !==
                                                                        null &&
                                                                      paper.aiScore !==
                                                                          undefined
                                                                    ? "Analyze Again"
                                                                    : "Analyze with AI"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* AI Analysis */}
                                                    {paper.aiSummary && (
                                                        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                                <h4 className="text-base font-semibold text-gray-900">
                                                                    AI
                                                                    Analysis
                                                                </h4>

                                                                {paper.aiScore !==
                                                                    null &&
                                                                    paper.aiScore !==
                                                                        undefined && (
                                                                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                                                                            {Math.round(
                                                                                paper.aiScore
                                                                            )}
                                                                            /100
                                                                        </span>
                                                                    )}
                                                            </div>

                                                            {/* Summary */}
                                                            <div className="mb-4">
                                                                <h5 className="mb-1 text-sm font-semibold text-gray-800">
                                                                    Summary
                                                                </h5>

                                                                <p className="text-sm leading-6 text-gray-700">
                                                                    {
                                                                        paper.aiSummary
                                                                    }
                                                                </p>
                                                            </div>

                                                            {/* Relevance */}
                                                            {paper.aiRelevance && (
                                                                <div className="mb-4">
                                                                    <h5 className="mb-1 text-sm font-semibold text-gray-800">
                                                                        Why
                                                                        this
                                                                        paper
                                                                        is
                                                                        relevant
                                                                    </h5>

                                                                    <p className="text-sm leading-6 text-gray-700">
                                                                        {
                                                                            paper.aiRelevance
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Key Findings */}
                                                            {paper.aiKeyFindings &&
                                                                paper
                                                                    .aiKeyFindings
                                                                    .length >
                                                                    0 && (
                                                                    <div className="mb-4">
                                                                        <h5 className="mb-2 text-sm font-semibold text-gray-800">
                                                                            Key
                                                                            Findings
                                                                        </h5>

                                                                        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-700">
                                                                            {paper.aiKeyFindings.map(
                                                                                (
                                                                                    finding,
                                                                                    index
                                                                                ) => (
                                                                                    <li
                                                                                        key={`${paper.id}-finding-${index}`}
                                                                                    >
                                                                                        {
                                                                                            finding
                                                                                        }
                                                                                    </li>
                                                                                )
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                )}

                                                            {/* Methodology */}
                                                            {paper.aiMethodology && (
                                                                <div>
                                                                    <h5 className="mb-1 text-sm font-semibold text-gray-800">
                                                                        Methodology
                                                                    </h5>

                                                                    <p className="text-sm leading-6 text-gray-700">
                                                                        {
                                                                            paper.aiMethodology
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </article>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        )}
                </div>
            </main>
        </div>
    );
}