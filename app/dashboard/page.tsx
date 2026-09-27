
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    createResearch,
    deleteResearch,
    getCurrentUser,
    getMyResearch,
    getResearchPapers,
    searchResearchPapers,
    type Paper,
    type Research,
} from "@/lib/graphql";

import Sidebar from "../components/dashboard/Sidebar";
import ResearchInput from "../components/dashboard/ResearchInput";
import ResearchSuggestions from "../components/dashboard/ResearchSuggestions";

const PAPERS_PER_PAGE = 5;

export default function DashboardPage() {
    const router = useRouter();

    const [isCheckingAuth, setIsCheckingAuth] =
        useState(true);

    const [isLoadingResearch, setIsLoadingResearch] =
        useState(false);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [isLoadingPapers, setIsLoadingPapers] =
        useState(false);

    const [isLoadingMore, setIsLoadingMore] =
        useState(false);

    const [researchList, setResearchList] =
        useState<Research[]>([]);

    const [researchTopic, setResearchTopic] =
        useState("");

    const [submittedTopic, setSubmittedTopic] =
        useState("");

    const [currentResearch, setCurrentResearch] =
        useState<Research | null>(null);

    const [papers, setPapers] =
        useState<Paper[]>([]);

    const [papersFound, setPapersFound] =
        useState<number | null>(null);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [hasMorePapers, setHasMorePapers] =
        useState(false);

    /*
     * ----------------------------------
     * Authentication + Research History
     * ----------------------------------
     */
    useEffect(() => {
        const loadDashboard = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsCheckingAuth(false);
                router.replace("/login");
                return;
            }

            try {
                await getCurrentUser(token);

                setIsLoadingResearch(true);

                const response =
                    await getMyResearch(token);

                setResearchList(response.myResearch);

                setIsCheckingAuth(false);
            } catch (error) {
                console.error(
                    "Authentication or research loading failed:",
                    error
                );

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                setIsCheckingAuth(false);
                router.replace("/login");
            } finally {
                setIsLoadingResearch(false);
            }
        };

        loadDashboard();
    }, [router]);

    /*
     * ----------------------------------
     * New Research
     * ----------------------------------
     */
    function handleNewResearch() {
        setResearchTopic("");
        setSubmittedTopic("");
        setCurrentResearch(null);
        setPapers([]);
        setPapersFound(null);
        setCurrentPage(1);
        setHasMorePapers(false);
    }

    /*
     * ----------------------------------
     * Load Research Papers
     * ----------------------------------
     */
    async function loadResearchPapers(
        research: Research,
        page = 1,
        append = false
    ) {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoadingPapers(true);
            setPapers([]);
        }

        try {
            const response =
                await getResearchPapers(
                    research.id,
                    token,
                    page,
                    PAPERS_PER_PAGE
                );

            const result =
                response.researchPapers;

            if (append) {
                setPapers((previousPapers) => [
                    ...previousPapers,
                    ...result.papers,
                ]);
            } else {
                setPapers(result.papers);
            }

            setCurrentPage(result.page);

            setPapersFound(result.total);

            setHasMorePapers(result.hasMore);
        } catch (error) {
            console.error(
                "Failed to load research papers:",
                error
            );

            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert(
                    "Unable to load research papers."
                );
            }
        } finally {
            setIsLoadingPapers(false);
            setIsLoadingMore(false);
        }
    }

    /*
     * ----------------------------------
     * Select Existing Research
     * ----------------------------------
     */
    async function handleSelectResearch(
        research: Research
    ) {
        setCurrentResearch(research);
        setResearchTopic("");
        setSubmittedTopic(research.title);
        setPapers([]);
        setPapersFound(null);
        setCurrentPage(1);
        setHasMorePapers(false);

        await loadResearchPapers(
            research,
            1,
            false
        );
    }

    /*
     * ----------------------------------
     * Load More Papers
     * ----------------------------------
     */
    async function handleLoadMore() {
        if (
            !currentResearch ||
            isLoadingMore ||
            !hasMorePapers
        ) {
            return;
        }

        await loadResearchPapers(
            currentResearch,
            currentPage + 1,
            true
        );
    }

    /*
     * ----------------------------------
     * Submit New Research
     * ----------------------------------
     */
    async function handleSubmit() {
        const trimmedTopic =
            researchTopic.trim();

        if (isSubmitting) {
            return;
        }

        if (!trimmedTopic) {
            alert(
                "Please enter a research topic."
            );
            return;
        }

        const conversationalMessages =
            new Set([
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
            ]);

        const normalizedTopic =
            trimmedTopic
                .toLowerCase()
                .replace(/[!?.,]+$/g, "")
                .trim();

        if (
            conversationalMessages.has(
                normalizedTopic
            )
        ) {
            alert(
                "Please enter an academic research topic, not a greeting or ordinary message."
            );
            return;
        }

        if (trimmedTopic.length < 8) {
            alert(
                "Please enter a more descriptive research topic."
            );
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        try {
            setIsSubmitting(true);
            setPapers([]);
            setPapersFound(null);
            setCurrentPage(1);
            setHasMorePapers(false);

            /*
             * Create research
             */
            const createResponse =
                await createResearch(
                    trimmedTopic,
                    token
                );

            const newResearch =
                createResponse.createResearch;

            setResearchList(
                (previousResearch) => [
                    newResearch,
                    ...previousResearch,
                ]
            );

            setSubmittedTopic(
                newResearch.title
            );

            setCurrentResearch(newResearch);

            setResearchTopic("");

            /*
             * Search and save academic papers
             */
            const searchResponse =
                await searchResearchPapers(
                    newResearch.id,
                    token
                );

            const totalFound =
                searchResponse
                    .searchResearchPapers
                    .totalFound;

            setPapersFound(totalFound);

            /*
             * Load the first page of saved papers.
             */
            await loadResearchPapers(
                newResearch,
                1,
                false
            );

            /*
             * Refresh research history.
             */
            const refreshedResearch =
                await getMyResearch(token);

            setResearchList(
                refreshedResearch.myResearch
            );

            const updatedResearch =
                refreshedResearch.myResearch.find(
                    (research) =>
                        research.id ===
                        newResearch.id
                );

            if (updatedResearch) {
                setCurrentResearch(
                    updatedResearch
                );
            }
        } catch (error) {
            console.error(
                "Research creation or paper search failed:",
                error
            );

            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert(
                    "Unable to create research or search academic papers."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    /*
     * ----------------------------------
     * Delete Research
     * ----------------------------------
     */
    async function handleDeleteResearch(
        research: Research
    ) {
        const confirmed =
            window.confirm(
                `Delete "${research.title}" and all its papers? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
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
                currentResearch?.id ===
                research.id
            ) {
                setCurrentResearch(null);
                setSubmittedTopic("");
                setResearchTopic("");
                setPapers([]);
                setPapersFound(null);
                setCurrentPage(1);
                setHasMorePapers(false);
            }
        } catch (error) {
            console.error(
                "Research deletion failed:",
                error
            );

            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert(
                    "Unable to delete this research."
                );
            }
        }
    }

    /*
     * ----------------------------------
     * Authentication Loading
     * ----------------------------------
     */
    if (isCheckingAuth) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">
                    Checking authentication...
                </p>
            </main>
        );
    }

    return (
        <main className="h-screen overflow-hidden bg-gray-50 flex">
            <Sidebar
                researchList={researchList}
                onNewResearch={handleNewResearch}
                onSelectResearch={
                    handleSelectResearch
                }
                onDeleteResearch={
                    handleDeleteResearch
                }
            />

            <section className="flex-1 min-w-0 min-h-0 flex flex-col">
                <header className="sticky top-0 z-40 h-16 shrink-0 bg-white border-b border-gray-200 flex items-center px-6 md:px-8">
                    <h2 className="font-semibold text-black ml-12 md:ml-0 truncate">
                        {currentResearch
                            ? currentResearch.title
                            : "New Research"}
                    </h2>
                </header>

                <div className="min-h-0 flex-1 flex flex-col items-center px-4 sm:px-6 py-10 overflow-y-auto">
                    <div className="w-full max-w-5xl">

                        {!submittedTopic && (
                            <div className="text-center mb-10 mt-10">
                                <h1 className="text-3xl sm:text-4xl font-bold text-black">
                                    What are you researching?
                                </h1>

                                <p className="mt-4 text-black text-base sm:text-lg">
                                    Ask ResearchAI to discover and evaluate academic literature.
                                </p>
                            </div>
                        )}

                        {isLoadingResearch && (
                            <div className="mb-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Loading your research...
                                </p>
                            </div>
                        )}

                        {submittedTopic && (
                            <div className="mb-8">
                                <div className="flex justify-end">
                                    <div className="max-w-xl bg-indigo-600 text-white rounded-2xl rounded-br-md px-5 py-3">
                                        <p>
                                            {
                                                submittedTopic
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5">
                                    <p className="text-sm font-medium text-black">
                                        ResearchAI
                                    </p>

                                    <p className="mt-2 text-sm text-black">
                                        {isSubmitting
                                            ? "Searching academic databases and saving real papers..."
                                            : isLoadingPapers
                                              ? "Loading saved academic papers..."
                                              : papersFound !== null
                                                ? `Research completed. ${papersFound} academic papers were found and saved.`
                                                : "Research saved successfully."}
                                    </p>
                                </div>
                            </div>
                        )}

                        <ResearchInput
                            researchTopic={
                                researchTopic
                            }
                            onResearchTopicChange={
                                setResearchTopic
                            }
                            onSubmit={handleSubmit}
                        />

                        {!submittedTopic && (
                            <ResearchSuggestions
                                onSelect={
                                    setResearchTopic
                                }
                            />
                        )}

                        {submittedTopic && (
                            <section className="mt-10">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-semibold text-black">
                                        Academic Papers
                                    </h3>

                                    <span className="text-sm text-gray-500">
                                        {papersFound !==
                                        null
                                            ? `${papers.length} of ${papersFound} loaded`
                                            : `${papers.length} papers`}
                                    </span>
                                </div>

                                {isLoadingPapers && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                                        <p className="text-sm text-gray-600">
                                            Loading papers...
                                        </p>
                                    </div>
                                )}

                                {!isLoadingPapers &&
                                    papers.length ===
                                        0 && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                                            <p className="text-sm text-gray-600">
                                                No papers found for this research yet.
                                            </p>
                                        </div>
                                    )}

                                <div className="space-y-5">
                                    {papers.map(
                                        (paper) => (
                                            <article
                                                key={
                                                    paper.id
                                                }
                                                className="rounded-2xl border border-gray-200 bg-white p-6"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <h4 className="text-lg font-semibold text-black">
                                                        {
                                                            paper.title
                                                        }
                                                    </h4>

                                                    {paper.isOpenAccess && (
                                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                            Open Access
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                                                    {paper.publicationYear && (
                                                        <span>
                                                            Year:{" "}
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
                                                            Journal:{" "}
                                                            {
                                                                paper.journal
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                {paper.authors.length >
                                                    0 && (
                                                    <p className="mt-3 text-sm text-gray-600">
                                                        <span className="font-medium">
                                                            Authors:
                                                        </span>{" "}
                                                        {paper.authors.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                )}

                                                {paper.abstract && (
                                                    <p className="mt-4 text-sm leading-6 text-gray-700">
                                                        {
                                                            paper.abstract
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-5 flex flex-wrap gap-3">
                                                    {paper.sourceUrl && (
                                                        <a
                                                            href={
                                                                paper.sourceUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                                        >
                                                            View Paper
                                                        </a>
                                                    )}

                                                    {paper.doi && (
                                                        <a
                                                            href={
                                                                paper.doi.startsWith(
                                                                    "http"
                                                                )
                                                                    ? paper.doi
                                                                    : `https://doi.org/${paper.doi.replace(
                                                                          "https://doi.org/",
                                                                          ""
                                                                      )}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            View DOI
                                                        </a>
                                                    )}
                                                </div>
                                            </article>
                                        )
                                    )}
                                </div>

                                {hasMorePapers && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={
                                                handleLoadMore
                                            }
                                            disabled={
                                                isLoadingMore
                                            }
                                            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isLoadingMore
                                                ? "Loading more papers..."
                                                : "Load more papers"}
                                        </button>
                                    </div>
                                )}

                                {!hasMorePapers &&
                                    papers.length >
                                        0 && (
                                        <p className="mt-8 text-center text-sm text-gray-500">
                                            All available papers have been loaded.
                                        </p>
                                    )}
                            </section>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}