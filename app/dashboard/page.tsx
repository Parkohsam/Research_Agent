"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";

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

const PAPERS_PER_PAGE = 5;

export default function DashboardPage() {
    const router = useRouter();

    /* ========================================= */
    /* State                                     */
    /* ========================================= */

    const [researchList, setResearchList] =
        useState<Research[]>([]);

    const [currentResearch, setCurrentResearch] =
        useState<Research | null>(null);

    const [papers, setPapers] =
        useState<Paper[]>([]);

    const [topic, setTopic] =
        useState("");

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

    const [loadingMorePapers, setLoadingMorePapers] =
        useState(false);

    const [papersFound, setPapersFound] =
        useState(0);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [hasMorePapers, setHasMorePapers] =
        useState(false);

    const [analyzingPaperId, setAnalyzingPaperId] =
        useState<string | null>(null);

    const [aiError, setAiError] =
        useState("");

    /* Mobile Sidebar */

    const [mobileSidebarOpen, setMobileSidebarOpen] =
        useState(false);

    /* ========================================= */
    /* Load Dashboard                            */
    /* ========================================= */

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

    /* ========================================= */
    /* Reset Paper Pagination                    */
    /* ========================================= */

    const resetPaperPagination = () => {
        setPapers([]);
        setPapersFound(0);
        setCurrentPage(1);
        setHasMorePapers(false);
        setPapersLoading(false);
        setLoadingMorePapers(false);
    };

    /* ========================================= */
    /* New Research                              */
    /* ========================================= */

    const handleNewResearch = () => {
        setCurrentResearch(null);

        resetPaperPagination();

        setTopic("");
        setSubmittedTopic("");
        setTopicError("");
        setAiError("");
        setAnalyzingPaperId(null);
    };

    /* ========================================= */
    /* Load First Page of Papers                 */
    /* ========================================= */

    const loadFirstPage = async (
        researchId: string,
        token: string
    ) => {
        setPapersLoading(true);
        setLoadingMorePapers(false);

        try {
            const response =
                await getResearchPapers(
                    researchId,
                    token,
                    1,
                    PAPERS_PER_PAGE
                );

            const result =
                response.researchPapers;

            setPapers(result.papers);

            setCurrentPage(result.page);

            setHasMorePapers(
                result.hasMore
            );

            setPapersFound(
                result.total
            );

            return result;
        } finally {
            setPapersLoading(false);
        }
    };

    /* ========================================= */
    /* Load More Papers                          */
    /* ========================================= */

    const handleLoadMorePapers = async () => {
        if (
            !currentResearch ||
            loadingMorePapers ||
            !hasMorePapers
        ) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        setLoadingMorePapers(true);
        setTopicError("");

        try {
            const nextPage =
                currentPage + 1;

            const response =
                await getResearchPapers(
                    currentResearch.id,
                    token,
                    nextPage,
                    PAPERS_PER_PAGE
                );

            const result =
                response.researchPapers;

            setPapers(
                (previousPapers) => {
                    const existingIds =
                        new Set(
                            previousPapers.map(
                                (paper) =>
                                    paper.id
                            )
                        );

                    const newPapers =
                        result.papers.filter(
                            (paper) =>
                                !existingIds.has(
                                    paper.id
                                )
                        );

                    return [
                        ...previousPapers,
                        ...newPapers,
                    ];
                }
            );

            setCurrentPage(
                result.page
            );

            setHasMorePapers(
                result.hasMore
            );

            setPapersFound(
                result.total
            );
        } catch (error) {
            console.error(
                "Failed to load more research papers:",
                error
            );

            setTopicError(
                error instanceof Error
                    ? error.message
                    : "Failed to load more research papers."
            );
        } finally {
            setLoadingMorePapers(false);
        }
    };

    /* ========================================= */
    /* Select Existing Research                  */
    /* ========================================= */

    const handleSelectResearch = async (
        research: Research
    ) => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        setMobileSidebarOpen(false);

        setCurrentResearch(research);

        setSubmittedTopic(
            research.title
        );

        setTopicError("");
        setAiError("");
        setAnalyzingPaperId(null);

        setPapers([]);
        setPapersFound(0);
        setCurrentPage(1);
        setHasMorePapers(false);

        try {
            await loadFirstPage(
                research.id,
                token
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

            setPapersLoading(false);
        }
    };

    /* ========================================= */
    /* Submit New Research                       */
    /* ========================================= */

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

        resetPaperPagination();

        setCurrentResearch(null);
        setSubmittedTopic(
            trimmedTopic
        );

        try {
            /* ============================== */
            /* Create Research                 */
            /* ============================== */

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

            /* ============================== */
            /* Search OpenAlex                 */
            /* ============================== */

            const searchResponse =
                await searchResearchPapers(
                    newResearch.id,
                    token
                );

            const totalFound =
                searchResponse
                    .searchResearchPapers
                    .totalFound;

            setPapersFound(
                totalFound
            );

            /* ============================== */
            /* Load First 5 Papers             */
            /* ============================== */

            await loadFirstPage(
                newResearch.id,
                token
            );

            /* ============================== */
            /* Refresh Sidebar                */
            /* ============================== */

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

            setPapersLoading(false);
        } finally {
            setLoading(false);
        }
    };

    /* ========================================= */
    /* Analyze Paper With AI                     */
    /* ========================================= */

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

            setPapers(
                (previousPapers) =>
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

    /* ========================================= */
    /* Delete Research                           */
    /* ========================================= */

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

                resetPaperPagination();

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

    /* ========================================= */
    /* Render                                    */
    /* ========================================= */

    return (
        <div className="min-h-screen overflow-x-hidden bg-gray-50 md:flex">
            {/* ================================= */}
            {/* Sidebar                            */}
            {/* ================================= */}

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
                mobileOpen={
                    mobileSidebarOpen
                }
                onCloseMobile={() =>
                    setMobileSidebarOpen(
                        false
                    )
                }
            />

            {/* ================================= */}
            {/* Main Content                       */}
            {/* ================================= */}

            <main className="min-w-0 flex-1">
                {/* ================================= */}
                {/* Header                            */}
                {/* ================================= */}

                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                        {/* Mobile Menu Button */}

                        <button
                            type="button"
                            onClick={() =>
                                setMobileSidebarOpen(
                                    true
                                )
                            }
                            aria-label="Open navigation"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50 md:hidden"
                        >
                            <Menu
                                size={20}
                            />
                        </button>

                        {/* Header Text */}

                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
                                {currentResearch
                                    ? currentResearch.title
                                    : "New Research"}
                            </h1>

                            <p className="mt-1 hidden text-sm text-gray-500 sm:block">
                                Discover and explore
                                academic research papers
                                with AI-powered analysis.
                            </p>
                        </div>

                        {/* Mobile User Avatar */}

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-white md:hidden">
                            {userName
                                ? userName
                                    .charAt(
                                        0
                                    )
                                    .toUpperCase()
                                : "U"}
                        </div>
                    </div>
                </header>

                {/* ================================= */}
                {/* Page Content                       */}
                {/* ================================= */}

                <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                    {/* ================================= */}
                    {/* Submitted Topic                   */}
                    {/* ================================= */}

                    {submittedTopic && (
                        <div className="mb-6">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                Research topic
                            </p>

                            <div className="break-words rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm leading-6 text-gray-800 shadow-sm">
                                {
                                    submittedTopic
                                }
                            </div>
                        </div>
                    )}

                    {/* ================================= */}
                    {/* Research Error                    */}
                    {/* ================================= */}

                    {topicError && (
                        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            <span className="shrink-0">
                                ⚠️
                            </span>

                            <p className="min-w-0 break-words">
                                {topicError}
                            </p>
                        </div>
                    )}

                    {/* ================================= */}
                    {/* AI Error                          */}
                    {/* ================================= */}

                    {aiError && (
                        <div className="mb-5 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-700">
                            <span className="shrink-0">
                                ⚠️
                            </span>

                            <p className="min-w-0 break-words">
                                {aiError}
                            </p>
                        </div>
                    )}

                    {/* ================================= */}
                    {/* Research Input                    */}
                    {/* ================================= */}

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

                    {/* ================================= */}
                    {/* Suggestions                        */}
                    {/* ================================= */}

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

                    {/* ================================= */}
                    {/* Initial Loading State             */}
                    {/* ================================= */}

                    {papersLoading && (
                        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="flex flex-col items-center justify-center">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-indigo-600"
                                />

                                <p className="mt-4 text-sm font-medium text-gray-800">
                                    Loading research
                                    papers...
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Finding the most
                                    relevant papers for
                                    your topic.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ================================= */}
                    {/* Research Papers                   */}
                    {/* ================================= */}

                    {!papersLoading &&
                        submittedTopic && (
                            <section className="mt-8">
                                {/* Papers Heading */}

                                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                                            Research
                                            Papers
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Showing{" "}
                                            <span className="font-medium text-gray-700">
                                                {
                                                    papers.length
                                                }
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-medium text-gray-700">
                                                {
                                                    papersFound
                                                }
                                            </span>{" "}
                                            papers
                                        </p>
                                    </div>
                                </div>

                                {/* ================================= */}
                                {/* No Papers                         */}
                                {/* ================================= */}

                                {papers.length ===
                                    0 ? (
                                    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                                        <p className="text-sm text-gray-600">
                                            No research
                                            papers
                                            found for
                                            this topic.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* ================================= */}
                                        {/* Paper List                        */}
                                        {/* ================================= */}

                                        <div className="space-y-5">
                                            {papers.map(
                                                (
                                                    paper
                                                ) => (
                                                    <article
                                                        key={
                                                            paper.id
                                                        }
                                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
                                                    >
                                                        {/* ================================= */}
                                                        {/* Paper Header                      */}
                                                        {/* ================================= */}

                                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                            {/* Paper Information */}

                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="break-words text-base font-semibold leading-6 text-gray-900 sm:text-lg">
                                                                    {
                                                                        paper.title
                                                                    }
                                                                </h3>

                                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-gray-500">
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
                                                                        <span className="break-words">
                                                                            {
                                                                                paper.journal
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Badges */}

                                                            <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col sm:items-end">
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

                                                        {/* ================================= */}
                                                        {/* Authors                          */}
                                                        {/* ================================= */}

                                                        {paper.authors
                                                            .length >
                                                            0 && (
                                                                <p className="mt-4 break-words text-sm leading-6 text-gray-600">
                                                                    <span className="font-medium text-gray-800">
                                                                        Authors:
                                                                    </span>{" "}
                                                                    {paper.authors.join(
                                                                        ", "
                                                                    )}
                                                                </p>
                                                            )}

                                                        {/* ================================= */}
                                                        {/* Abstract                         */}
                                                        {/* ================================= */}

                                                        {paper.abstract && (
                                                            <div className="mt-4">
                                                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Abstract
                                                                </p>

                                                                <p className="line-clamp-4 break-words text-sm leading-6 text-gray-700">
                                                                    {
                                                                        paper.abstract
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* ================================= */}
                                                        {/* Actions                          */}
                                                        {/* ================================= */}

                                                        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                                                            {/* View Paper */}

                                                            {paper.sourceUrl && (
                                                                <a
                                                                    href={
                                                                        paper.sourceUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
                                                                >
                                                                    View
                                                                    Paper
                                                                </a>
                                                            )}

                                                            {/* View DOI */}

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
                                                                    className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                                                                >
                                                                    View
                                                                    DOI
                                                                </a>
                                                            )}

                                                            {/* Analyze With AI */}

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
                                                                    className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

                                                        {/* ================================= */}
                                                        {/* AI Analysis                      */}
                                                        {/* ================================= */}

                                                        {paper.aiSummary && (
                                                            <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
                                                                {/* AI Header */}

                                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

                                                                    <p className="break-words text-sm leading-6 text-gray-700">
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

                                                                        <p className="break-words text-sm leading-6 text-gray-700">
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
                                                                                            className="break-words"
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

                                                                        <p className="break-words text-sm leading-6 text-gray-700">
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

                                        {/* ================================= */}
                                        {/* Load More Papers                  */}
                                        {/* ================================= */}

                                        {hasMorePapers && (
                                            <div className="mt-8 flex flex-col items-center justify-center">
                                                {loadingMorePapers ? (
                                                    <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm">
                                                        <Loader2
                                                            size={24}
                                                            className="animate-spin text-indigo-600"
                                                        />

                                                        <p className="mt-3 text-sm font-medium text-gray-800">
                                                            Loading
                                                            more
                                                            papers...
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Finding
                                                            the
                                                            next
                                                            set
                                                            of
                                                            relevant
                                                            papers.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleLoadMorePapers
                                                        }
                                                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
                                                    >
                                                        Load
                                                        More
                                                        Papers
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* ================================= */}
                                        {/* All Papers Loaded                 */}
                                        {/* ================================= */}

                                        {!hasMorePapers &&
                                            papers.length >
                                            0 && (
                                                <div className="mt-8 text-center">
                                                    <p className="text-xs text-gray-500">
                                                        You&apos;ve
                                                        reached
                                                        the end
                                                        of the
                                                        available
                                                        relevant
                                                        papers.
                                                    </p>
                                                </div>
                                            )}
                                    </>
                                )}
                            </section>
                        )}
                </div>
            </main>
        </div>
    );
}