const OPENALEX_API_URL =
    "https://api.openalex.org/works";

const OPENALEX_API_KEY =
    process.env.OPENALEX_API_KEY || "";

const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "using",
    "use",
    "with",
    "within",
    "via",
    "based",
    "study",
    "studies",
    "analysis",
    "review",
    "research",
    "approach",
    "methods",
    "method",
]);

/*
 * ---------------------------------------------------------
 * TEXT HELPERS
 * ---------------------------------------------------------
 */

const normalizeText = (text = "") =>
    text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

const tokenize = (text = "") => {
    return normalizeText(text)
        .split(" ")
        .map((word) => word.trim())
        .filter(
            (word) =>
                word.length >= 3 &&
                !STOP_WORDS.has(word)
        );
};

/*
 * ---------------------------------------------------------
 * BUILD IMPORTANT SEARCH TERMS
 * ---------------------------------------------------------
 */

const buildImportantTerms = (topic) => {
    const normalizedTopic =
        normalizeText(topic);

    const words = [
        ...new Set(
            tokenize(normalizedTopic)
        ),
    ];

    const phrases = [];

    /*
     * Original topic
     */
    if (normalizedTopic.length >= 8) {
        phrases.push(normalizedTopic);
    }

    /*
     * Two-word phrases
     */
    for (
        let i = 0;
        i < words.length - 1;
        i++
    ) {
        const phrase =
            `${words[i]} ${words[i + 1]}`;

        if (
            phrase.length >= 8 &&
            !phrases.includes(phrase)
        ) {
            phrases.push(phrase);
        }
    }

    /*
     * Three-word phrases
     */
    for (
        let i = 0;
        i < words.length - 2;
        i++
    ) {
        const phrase =
            `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

        if (
            phrase.length >= 12 &&
            !phrases.includes(phrase)
        ) {
            phrases.push(phrase);
        }
    }

    return {
        normalizedTopic,
        words,
        phrases,
    };
};

/*
 * ---------------------------------------------------------
 * RECONSTRUCT OPENALEX ABSTRACT
 * ---------------------------------------------------------
 */

const reconstructAbstract = (
    abstractInvertedIndex
) => {
    if (!abstractInvertedIndex) {
        return "";
    }

    const words = [];

    for (
        const [word, positions]
        of Object.entries(
            abstractInvertedIndex
        )
    ) {
        for (const position of positions) {
            words[position] = word;
        }
    }

    return words
        .filter(Boolean)
        .join(" ");
};

/*
 * ---------------------------------------------------------
 * RELEVANCE SCORE
 * ---------------------------------------------------------
 *
 * The topic terms are passed in instead of rebuilding them
 * for every paper.
 * ---------------------------------------------------------
 */

const calculateRelevanceScore = (
    paper,
    topicTerms
) => {
    const title =
        normalizeText(
            paper.display_name || ""
        );

    const abstract =
        normalizeText(
            reconstructAbstract(
                paper.abstract_inverted_index
            )
        );

    const combinedText =
        `${title} ${abstract}`.trim();

    if (!combinedText) {
        return 0;
    }

    const {
        normalizedTopic,
        words,
        phrases,
    } = topicTerms;

    let score = 0;

    /*
     * -----------------------------------------------------
     * TITLE MATCHING
     * -----------------------------------------------------
     */

    const titleWords = new Set(
        tokenize(title)
    );

    let titleMatches = 0;

    for (const word of words) {
        if (titleWords.has(word)) {
            titleMatches++;
        }
    }

    if (words.length > 0) {
        score +=
            (titleMatches / words.length) *
            0.45;
    }

    /*
     * -----------------------------------------------------
     * ABSTRACT / COMBINED TEXT MATCHING
     * -----------------------------------------------------
     */

    let matchedWords = 0;

    for (const word of words) {
        if (
            combinedText.includes(word)
        ) {
            matchedWords++;
        }
    }

    if (words.length > 0) {
        score +=
            (matchedWords / words.length) *
            0.30;
    }

    /*
     * -----------------------------------------------------
     * PHRASE MATCHING
     * -----------------------------------------------------
     */

    const usablePhrases =
        phrases.filter(
            (phrase) =>
                phrase !== normalizedTopic
        );

    let phraseMatches = 0;

    for (const phrase of usablePhrases) {
        if (
            combinedText.includes(
                phrase
            )
        ) {
            phraseMatches++;
        }
    }

    if (usablePhrases.length > 0) {
        score +=
            (phraseMatches /
                usablePhrases.length) *
            0.20;
    }

    /*
     * -----------------------------------------------------
     * EXACT TOPIC MATCH
     * -----------------------------------------------------
     */

    if (
        normalizedTopic &&
        combinedText.includes(
            normalizedTopic
        )
    ) {
        score += 0.15;
    }

    return Math.min(score, 1);
};

/*
 * ---------------------------------------------------------
 * FETCH OPENALEX WITH RETRY + TIMEOUT
 * ---------------------------------------------------------
 */

const fetchOpenAlex = async (
    url,
    maxRetries = 3
) => {
    let lastError = null;

    for (
        let attempt = 0;
        attempt < maxRetries;
        attempt++
    ) {
        const controller =
            new AbortController();

        /*
         * Don't allow one OpenAlex request
         * to hang your entire research request.
         */
        const timeout =
            setTimeout(() => {
                controller.abort();
            }, 15000);

        try {
            const headers = {
                Accept:
                    "application/json",
            };

            /*
             * OpenAlex supports Bearer authentication.
             *
             * The API key should be stored in Render
             * environment variables.
             */
            if (OPENALEX_API_KEY) {
                headers.Authorization =
                    `Bearer ${OPENALEX_API_KEY}`;
            }

            const response =
                await fetch(url, {
                    method: "GET",
                    headers,
                    signal:
                        controller.signal,
                });

            clearTimeout(timeout);

            /*
             * SUCCESS
             */
            if (response.ok) {
                return await response.json();
            }

            /*
             * TEMPORARY ERRORS
             *
             * 429 = rate limit
             * 500 = server error
             * 502 = bad gateway
             * 503 = service unavailable
             * 504 = gateway timeout
             */
            const retryableStatuses =
                new Set([
                    429,
                    500,
                    502,
                    503,
                    504,
                ]);

            if (
                retryableStatuses.has(
                    response.status
                )
            ) {
                const retryAfter =
                    response.headers.get(
                        "retry-after"
                    );

                let waitTime;

                if (retryAfter) {
                    const retrySeconds =
                        Number(
                            retryAfter
                        );

                    waitTime =
                        Number.isFinite(
                            retrySeconds
                        )
                            ? retrySeconds *
                              1000
                            : 1000;
                } else {
                    /*
                     * Exponential backoff:
                     *
                     * attempt 1 -> 1 second
                     * attempt 2 -> 2 seconds
                     * attempt 3 -> 4 seconds
                     */
                    waitTime =
                        Math.pow(
                            2,
                            attempt
                        ) * 1000;
                }

                console.warn(
                    `OpenAlex returned ${response.status}. ` +
                    `Retrying in ${waitTime}ms ` +
                    `(attempt ${attempt + 1}/${maxRetries})`
                );

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            waitTime
                        )
                );

                continue;
            }

            /*
             * NON-RETRYABLE ERROR
             */

            let errorMessage =
                `OpenAlex request failed with status ${response.status}`;

            try {
                const errorData =
                    await response.json();

                if (
                    errorData?.message
                ) {
                    errorMessage +=
                        `: ${errorData.message}`;
                } else if (
                    errorData?.error
                ) {
                    errorMessage +=
                        `: ${errorData.error}`;
                }
            } catch {
                /*
                 * Ignore JSON parsing errors.
                 */
            }

            throw new Error(
                errorMessage
            );
        } catch (error) {
            clearTimeout(timeout);

            lastError = error;

            /*
             * Request timeout
             */
            if (
                error?.name ===
                "AbortError"
            ) {
                console.warn(
                    `OpenAlex request timed out ` +
                    `(attempt ${attempt + 1}/${maxRetries})`
                );
            } else {
                console.warn(
                    `OpenAlex request error: ${error.message}`
                );
            }

            /*
             * Retry network errors / timeouts.
             *
             * If it is the final attempt,
             * throw below.
             */
            if (
                attempt <
                maxRetries - 1
            ) {
                const waitTime =
                    Math.pow(
                        2,
                        attempt
                    ) * 1000;

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            waitTime
                        )
                );
            }
        }
    }

    throw new Error(
        lastError?.message ||
            "OpenAlex request failed after multiple attempts"
    );
};

/*
 * ---------------------------------------------------------
 * SEARCH ACADEMIC PAPERS
 * ---------------------------------------------------------
 */

const searchAcademicPapers =
    async (topic) => {
        const trimmedTopic =
            topic?.trim();

        if (!trimmedTopic) {
            throw new Error(
                "Research topic is required"
            );
        }

        /*
         * Build topic terms once.
         */
        const topicTerms =
            buildImportantTerms(
                trimmedTopic
            );

        /*
         * OpenAlex URL
         */
        const url = new URL(
            OPENALEX_API_URL
        );

        /*
         * Full-text academic search.
         */
        url.searchParams.set(
            "search",
            trimmedTopic
        );

        /*
         * We only need enough candidates
         * to find the strongest papers.
         *
         * 25 is significantly lighter than
         * fetching 100 and processing all
         * their abstracts.
         */
        url.searchParams.set(
            "per-page",
            "25"
        );

        /*
         * Only request fields that
         * our application actually uses.
         */
        url.searchParams.set(
            "select",
            [
                "id",
                "display_name",
                "publication_year",
                "doi",
                "authorships",
                "primary_location",
                "open_access",
                "cited_by_count",
                "abstract_inverted_index",
            ].join(",")
        );

        /*
         * Fetch from OpenAlex with
         * timeout + retry protection.
         */
        const data =
            await fetchOpenAlex(
                url.toString(),
                3
            );

        const results =
            Array.isArray(
                data?.results
            )
                ? data.results
                : [];

        /*
         * Calculate relevance.
         */
        const scoredResults =
            results.map(
                (paper) => ({
                    ...paper,

                    relevanceScore:
                        calculateRelevanceScore(
                            paper,
                            topicTerms
                        ),
                })
            );

        /*
         * Remove weak results.
         */
        const relevantResults =
            scoredResults
                .filter(
                    (paper) =>
                        paper.relevanceScore >=
                        0.25
                )
                .sort(
                    (a, b) =>
                        b.relevanceScore -
                        a.relevanceScore
                );

        /*
         * Return strongest 25.
         */
        return relevantResults.slice(
            0,
            25
        );
    };

/*
 * ---------------------------------------------------------
 * NORMALIZE ACADEMIC PAPER
 * ---------------------------------------------------------
 */

const normalizeAcademicPaper =
    (paper) => {
        const source =
            paper.primary_location
                ?.source;

        const authors =
            (
                paper.authorships ||
                []
            )
                .map(
                    (authorship) =>
                        authorship
                            .author
                            ?.display_name
                )
                .filter(Boolean);

        return {
            openAlexId:
                paper.id,

            title:
                paper.display_name ||
                "Untitled paper",

            abstract:
                reconstructAbstract(
                    paper.abstract_inverted_index
                ),

            publicationYear:
                paper.publication_year ||
                null,

            doi:
                paper.doi || "",

            authors,

            journal:
                source?.display_name ||
                "",

            sourceUrl:
                paper.primary_location
                    ?.landing_page_url ||
                paper.primary_location
                    ?.pdf_url ||
                "",

            citationCount:
                paper.cited_by_count ||
                0,

            isOpenAccess:
                paper.open_access
                    ?.is_oa ||
                false,

            relevanceScore:
                Number(
                    (
                        paper.relevanceScore ||
                        0
                    ).toFixed(3)
                ),
        };
    };

/*
 * ---------------------------------------------------------
 * EXPORTS
 * ---------------------------------------------------------
 */

module.exports = {
    searchAcademicPapers,
    normalizeAcademicPaper,
};