"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    createResearch,
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

export default function DashboardPage() {
    const router = useRouter();

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoadingResearch, setIsLoadingResearch] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [researchList, setResearchList] = useState<Research[]>(
        []
    );

    const [researchTopic, setResearchTopic] = useState("");
    const [submittedTopic, setSubmittedTopic] = useState("");

    const [currentResearch, setCurrentResearch] =
        useState<Research | null>(null);

    const [papersFound, setPapersFound] = useState<number | null>(
        null
    );

    const [papers, setPapers] = useState<Paper[]>([]);

    useEffect(() => {
        const verifyAuthentication = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsCheckingAuth(false);
                router.replace("/login");
                return;
            }

            try {
                await getCurrentUser(token);

                setIsLoadingResearch(true);

                const response = await getMyResearch(token);

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

        verifyAuthentication();
    }, [router]);

    function handleNewResearch() {
        setResearchTopic("");
        setSubmittedTopic("");
        setCurrentResearch(null);
        setPapersFound(null);
        setPapers([]);
    }

    async function handleSelectResearch(research: Research) {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        try {
            setCurrentResearch(research);
            setResearchTopic("");
            setSubmittedTopic(research.title);
            setPapersFound(null);
            setPapers([]);

            const response = await getResearchPapers(
                research.id,
                token
            );

            setPapers(response.researchPapers);
            setPapersFound(response.researchPapers.length);
        } catch (error) {
            console.error(
                "Failed to load research papers:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to load research papers."
            );
        }
    }

    async function handleSubmit() {
        const trimmedTopic = researchTopic.trim();

        if (!trimmedTopic || isSubmitting) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        try {
            setIsSubmitting(true);
            setPapersFound(null);
            setPapers([]);

            // Step 1: Create the research record
            const createResponse = await createResearch(
                trimmedTopic,
                token
            );

            const newResearch = createResponse.createResearch;

            // Show the newly created research immediately
            setResearchList((previousResearch) => [
                newResearch,
                ...previousResearch,
            ]);

            setSubmittedTopic(newResearch.title);
            setCurrentResearch(newResearch);
            setResearchTopic("");

            // Step 2: Search OpenAlex and save real papers
            const searchResponse = await searchResearchPapers(
                newResearch.id,
                token
            );

            const totalFound =
                searchResponse.searchResearchPapers.totalFound;

            setPapersFound(totalFound);

            // Step 3: Fetch the saved papers
            const papersResponse = await getResearchPapers(
                newResearch.id,
                token
            );

            setPapers(papersResponse.researchPapers);

            // Step 4: Refresh the research list
            const refreshedResearch = await getMyResearch(
                token
            );

            setResearchList(refreshedResearch.myResearch);

            const updatedResearch =
                refreshedResearch.myResearch.find(
                    (research) =>
                        research.id === newResearch.id
                );

            if (updatedResearch) {
                setCurrentResearch(updatedResearch);
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
                    "Unable to create research or search academic papers. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

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
                                    Ask ResearchAI to discover and
                                    evaluate academic literature.
                                </p>
                            </div>
                        )}

                        {/* Saved research loading message */}
                        {isLoadingResearch && (
                            <div className="mb-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Loading your research...
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

                                <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5">
                                    <p className="text-sm font-medium text-black">
                                        ResearchAI
                                    </p>

                                    <p className="mt-2 text-sm text-black">
                                        {isSubmitting
                                            ? "Searching academic databases and saving real papers..."
                                            : papersFound !== null
                                              ? `Research completed. ${papersFound} academic papers were found and saved.`
                                              : "Research saved successfully."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Academic papers */}
                        {submittedTopic && (
                            <section className="mb-10">
                                <div className="mb-5">
                                    <h2 className="text-2xl font-semibold text-black">
                                        Academic Papers
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600">
                                        {papers.length} papers found for
                                        this research.
                                    </p>
                                </div>

                                {isSubmitting ? (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                                        <p className="text-sm text-gray-600">
                                            Finding academic papers...
                                        </p>
                                    </div>
                                ) : papers.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                                        <p className="text-sm text-gray-600">
                                            No academic papers found yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {papers.map((paper) => (
                                            <article
                                                key={paper.id}
                                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                                    {paper.publicationYear && (
                                                        <span>
                                                            {
                                                                paper.publicationYear
                                                            }
                                                        </span>
                                                    )}

                                                    {paper.journal && (
                                                        <span>
                                                            •{" "}
                                                            {
                                                                paper.journal
                                                            }
                                                        </span>
                                                    )}

                                                    <span>
                                                        •{" "}
                                                        {
                                                            paper.citationCount
                                                        }{" "}
                                                        citations
                                                    </span>

                                                    {paper.isOpenAccess && (
                                                        <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                                                            Open Access
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="mt-3 text-lg font-semibold leading-7 text-black">
                                                    {paper.title}
                                                </h3>

                                                {paper.abstract && (
                                                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
                                                        {
                                                            paper.abstract
                                                        }
                                                    </p>
                                                )}

                                                {paper.authors.length >
                                                    0 && (
                                                    <p className="mt-3 text-sm text-gray-500">
                                                        <span className="font-medium text-gray-700">
                                                            Authors:
                                                        </span>{" "}
                                                        {paper.authors.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                )}

                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    {paper.sourceUrl && (
                                                        <a
                                                            href={
                                                                paper.sourceUrl
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
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
                                                                    : `https://doi.org/${paper.doi}`
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                                                        >
                                                            View DOI
                                                        </a>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
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