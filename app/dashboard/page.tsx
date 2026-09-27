"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Loader2,
    Search,
    BookOpen,
    ChevronDown,
    ExternalLink,
    Sparkles,
} from "lucide-react";

import {
    getResearchPapers,
    type Paper,
    type Research,
} from "@/lib/graphql";

type DashboardProps = {
    researchList?: Research[];
    selectedResearch: Research | null;
    token: string;
    onSelectResearch?: (research: Research) => void;
};

const PAPERS_PER_PAGE = 5;

export default function Dashboard({
    researchList,
    selectedResearch,
    token,
    onSelectResearch,
}: DashboardProps) {
    /*
     * Always make sure researchList is an array.
     *
     * This prevents:
     * "Cannot read properties of undefined (reading 'length')"
     */
    const safeResearchList = researchList ?? [];

    const [papers, setPapers] = useState<Paper[]>([]);

    const [currentPage, setCurrentPage] = useState(1);

    const [totalPapers, setTotalPapers] = useState(0);

    const [hasMore, setHasMore] = useState(false);

    const [loadingPapers, setLoadingPapers] =
        useState(false);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [error, setError] = useState("");

    /*
     * Load papers from GraphQL.
     *
     * First request:
     * page 1 -> 5 papers
     *
     * Next request:
     * page 2 -> next 5 papers
     *
     * Next request:
     * page 3 -> next 5 papers
     */
    const loadPapers = useCallback(
        async (
            researchId: string,
            page: number,
            append = false
        ) => {
            if (!token || !researchId) {
                return;
            }

            if (!append) {
                setPapers([]);
                setCurrentPage(1);
                setTotalPapers(0);
                setHasMore(false);
            }

            try {
                setError("");

                if (append) {
                    setLoadingMore(true);
                } else {
                    setLoadingPapers(true);
                }

                const response =
                    await getResearchPapers(
                        researchId,
                        token,
                        page,
                        PAPERS_PER_PAGE
                    );

                const result =
                    response?.researchPapers;

                if (!result) {
                    throw new Error(
                        "No research papers were returned."
                    );
                }

                const newPapers =
                    result.papers ?? [];

                /*
                 * Append new papers while
                 * preventing duplicates.
                 */
                setPapers((previousPapers) => {
                    if (!append) {
                        return newPapers;
                    }

                    const existingIds =
                        new Set(
                            previousPapers.map(
                                (paper) => paper.id
                            )
                        );

                    const uniqueNewPapers =
                        newPapers.filter(
                            (paper) =>
                                !existingIds.has(
                                    paper.id
                                )
                        );

                    return [
                        ...previousPapers,
                        ...uniqueNewPapers,
                    ];
                });

                setCurrentPage(result.page);

                setTotalPapers(result.total);

                setHasMore(result.hasMore);
            } catch (err) {
                console.error(
                    "Failed to load research papers:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load research papers. Please try again."
                );
            } finally {
                setLoadingPapers(false);
                setLoadingMore(false);
            }
        },
        [token]
    );

    /*
     * Whenever the selected research changes,
     * start again from page 1.
     */
    useEffect(() => {
        if (!selectedResearch) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void loadPapers(
                selectedResearch.id,
                1,
                false
            );
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [
        selectedResearch,
        loadPapers,
    ]);

    /*
     * Load the next batch of papers.
     */
    const handleLoadMore = () => {
        if (
            !selectedResearch ||
            loadingMore ||
            loadingPapers ||
            !hasMore
        ) {
            return;
        }

        loadPapers(
            selectedResearch.id,
            currentPage + 1,
            true
        );
    };

    /*
     * No research selected.
     */
    if (!selectedResearch) {
        return (
            <main className="flex min-h-screen flex-1 items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                        <Search
                            size={25}
                            className="text-indigo-600"
                        />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900">
                        Select a research topic
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        Select a research project from
                        the sidebar to view its academic
                        papers.
                    </p>

                    {safeResearchList.length > 0 && (
                        <div className="mt-6">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Your research
                            </p>

                            <div className="flex flex-wrap justify-center gap-2">
                                {safeResearchList.map(
                                    (research) => (
                                        <button
                                            key={
                                                research.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                onSelectResearch?.(
                                                    research
                                                )
                                            }
                                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                        >
                                            {research.title}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex-1 overflow-y-auto bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">

                {/* Header */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                                    <BookOpen
                                        size={18}
                                        className="text-indigo-600"
                                    />
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                    Research
                                </span>
                            </div>

                            <h1 className="break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                                {selectedResearch.title}
                            </h1>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen
                                        size={15}
                                    />

                                    {totalPapers} papers
                                </span>

                                {papers.length > 0 && (
                                    <span>
                                        Showing{" "}
                                        {papers.length}{" "}
                                        of{" "}
                                        {totalPapers}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Research ready
                        </div>
                    </div>
                </div>

                {/* Initial loading */}
                {loadingPapers &&
                    papers.length === 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                                    <Loader2
                                        size={24}
                                        className="animate-spin text-indigo-600"
                                    />
                                </div>

                                <h2 className="text-base font-semibold text-gray-900">
                                    Loading research
                                    papers
                                </h2>

                                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                                    We&apos;re retrieving
                                    relevant academic
                                    papers for this
                                    research topic.
                                </p>
                            </div>
                        </div>
                    )}

                {/* Initial error */}
                {error &&
                    papers.length === 0 &&
                    !loadingPapers && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    loadPapers(
                                        selectedResearch.id,
                                        1,
                                        false
                                    )
                                }
                                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                {/* Papers */}
                {papers.length > 0 && (
                    <>
                        <div className="space-y-4">
                            {papers.map(
                                (
                                    paper,
                                    index
                                ) => (
                                    <article
                                        key={
                                            paper.id
                                        }
                                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                                    >
                                        <div className="flex flex-col gap-4">

                                            {/* Paper header */}
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                                                    {index +
                                                        1}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-base font-semibold leading-6 text-gray-900 sm:text-lg">
                                                        {
                                                            paper.title
                                                        }
                                                    </h2>

                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                                        {paper.journal && (
                                                            <span>
                                                                {
                                                                    paper.journal
                                                                }
                                                            </span>
                                                        )}

                                                        {paper.publicationYear && (
                                                            <span>
                                                                {
                                                                    paper.publicationYear
                                                                }
                                                            </span>
                                                        )}

                                                        <span>
                                                            {
                                                                paper.citationCount
                                                            }{" "}
                                                            citations
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Authors */}
                                            {paper.authors?.length >
                                                0 && (
                                                <div className="pl-0 text-sm text-gray-600 sm:pl-12">
                                                    <span className="font-medium text-gray-700">
                                                        Authors:
                                                    </span>{" "}
                                                    {paper.authors.join(
                                                        ", "
                                                    )}
                                                </div>
                                            )}

                                            {/* Abstract */}
                                            {paper.abstract && (
                                                <div className="pl-0 sm:pl-12">
                                                    <p className="text-sm leading-6 text-gray-600">
                                                        {
                                                            paper.abstract
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {/* Relevance */}
                                            {paper.relevanceScore !=
                                                null && (
                                                <div className="pl-0 sm:pl-12">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500">
                                                            Relevance
                                                        </span>

                                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                                                            <div
                                                                className="h-full rounded-full bg-indigo-600"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        Math.max(
                                                                            paper.relevanceScore *
                                                                                100,
                                                                            0
                                                                        ),
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <span className="text-xs font-semibold text-indigo-600">
                                                            {Math.round(
                                                                Math.min(
                                                                    Math.max(
                                                                        paper.relevanceScore *
                                                                            100,
                                                                        0
                                                                    ),
                                                                    100
                                                                )
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI analysis */}
                                            {paper.aiSummary && (
                                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:ml-12">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <Sparkles
                                                            size={
                                                                15
                                                            }
                                                            className="text-indigo-600"
                                                        />

                                                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                                            AI
                                                            Analysis
                                                        </span>
                                                    </div>

                                                    <p className="text-sm leading-6 text-gray-700">
                                                        {
                                                            paper.aiSummary
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {/* Bottom actions */}
                                            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:ml-12 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex flex-wrap gap-2">
                                                    {paper.isOpenAccess && (
                                                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                            Open
                                                            access
                                                        </span>
                                                    )}

                                                    {paper.evaluationStatus && (
                                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                                                            {paper.evaluationStatus.replace(
                                                                /_/g,
                                                                " "
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {paper.sourceUrl && (
                                                    <a
                                                        href={
                                                            paper.sourceUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                                    >
                                                        View
                                                        paper

                                                        <ExternalLink
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>

                        {/* Loading more */}
                        {loadingMore && (
                            <div className="flex items-center justify-center py-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2
                                        size={18}
                                        className="animate-spin text-indigo-600"
                                    />

                                    Loading more
                                    papers...
                                </div>
                            </div>
                        )}

                        {/* Load more */}
                        {!loadingMore &&
                            hasMore && (
                                <div className="flex justify-center py-6">
                                    <button
                                        type="button"
                                        onClick={
                                            handleLoadMore
                                        }
                                        disabled={
                                            loadingMore
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <ChevronDown
                                            size={17}
                                        />

                                        Load more
                                        papers
                                    </button>
                                </div>
                            )}

                        {/* Finished */}
                        {!hasMore &&
                            papers.length > 0 &&
                            !loadingMore && (
                                <div className="py-6 text-center">
                                    <p className="text-xs text-gray-400">
                                        You&apos;ve reached
                                        the end of the
                                        available
                                        papers.
                                    </p>
                                </div>
                            )}

                        {/* Loading-more error */}
                        {error &&
                            papers.length > 0 && (
                                <div className="flex flex-col items-center justify-center gap-3 py-5">
                                    <p className="text-sm text-red-600">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            handleLoadMore
                                        }
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}
                    </>
                )}

                {/* No papers */}
                {!loadingPapers &&
                    !error &&
                    papers.length === 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                            <BookOpen
                                size={30}
                                className="mx-auto text-gray-400"
                            />

                            <h2 className="mt-4 text-base font-semibold text-gray-900">
                                No research papers found
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                No relevant papers were
                                found for this research
                                topic.
                            </p>
                        </div>
                    )}
            </div>
        </main>
    );
}