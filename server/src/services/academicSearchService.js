const OPENALEX_API_URL =
    "https://api.openalex.org/works";

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

const buildImportantTerms = (topic) => {
    const normalizedTopic =
        normalizeText(topic);

    const words = tokenize(
        normalizedTopic
    );

    const phrases = [];

    /*
     * Keep the original topic.
     */
    if (normalizedTopic.length >= 8) {
        phrases.push(normalizedTopic);
    }

    /*
     * Generate 2-word phrases.
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
     * Generate 3-word phrases.
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
        words: [...new Set(words)],
        phrases,
    };
};

const reconstructAbstract = (
    abstractInvertedIndex
) => {
    if (!abstractInvertedIndex) {
        return "";
    }

    const words = [];

    for (
        const [word, positions] of Object.entries(
            abstractInvertedIndex
        )
    ) {
        for (
            const position of positions
        ) {
            words[position] = word;
        }
    }

    return words
        .filter(Boolean)
        .join(" ");
};

const calculateRelevanceScore = (
    paper,
    topic,
    importantTerms
) => {
    const title = normalizeText(
        paper.display_name || ""
    );

    const abstract = normalizeText(
        reconstructAbstract(
            paper.abstract_inverted_index
        )
    );

    const combinedText =
        `${title} ${abstract}`;

    if (!combinedText.trim()) {
        return 0;
    }

    const {
        words,
        phrases,
        normalizedTopic,
    } = importantTerms;

    let score = 0;

    /*
     * TITLE MATCHING
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
            (titleMatches /
                words.length) *
            0.45;
    }

    /*
     * ABSTRACT / CONTENT MATCHING
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
            (matchedWords /
                words.length) *
            0.3;
    }

    /*
     * PHRASE MATCHING
     */
    const usablePhrases =
        phrases.filter(
            (phrase) =>
                phrase !==
                normalizedTopic
        );

    let phraseMatches = 0;

    for (
        const phrase of usablePhrases
    ) {
        if (
            combinedText.includes(
                phrase
            )
        ) {
            phraseMatches++;
        }
    }

    if (
        usablePhrases.length > 0
    ) {
        score +=
            (phraseMatches /
                usablePhrases.length) *
            0.2;
    }

    /*
     * EXACT TOPIC MATCH
     */
    if (
        combinedText.includes(
            normalizedTopic
        )
    ) {
        score += 0.15;
    }

    return Math.min(score, 1);
};

const searchAcademicPapers = async (
    topic
) => {
    const trimmedTopic =
        topic.trim();

    if (!trimmedTopic) {
        throw new Error(
            "Research topic is required"
        );
    }

    /*
     * Build important terms ONCE.
     *
     * Previously this was being
     * rebuilt for every paper.
     */
    const importantTerms =
        buildImportantTerms(
            trimmedTopic
        );

    const url = new URL(
        OPENALEX_API_URL
    );

    /*
     * Search OpenAlex.
     *
     * We only need a reasonable
     * candidate pool.
     */
    url.searchParams.set(
        "search",
        trimmedTopic
    );

    /*
     * 25 candidates is enough for
     * our first result set and is
     * significantly lighter than
     * requesting 100.
     */
    url.searchParams.set(
        "per-page",
        "25"
    );

    /*
     * Request only fields that we
     * actually use.
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
     * Prevent an indefinitely slow
     * OpenAlex request.
     */
    const controller =
        new AbortController();

    const timeout = setTimeout(
        () => {
            controller.abort();
        },
        15000
    );

    let response;

    try {
        response = await fetch(
            url,
            {
                signal:
                    controller.signal,
            }
        );
    } catch (error) {
        if (
            error?.name ===
            "AbortError"
        ) {
            throw new Error(
                "OpenAlex request timed out. Please try again."
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error(
            `OpenAlex request failed with status ${response.status}`
        );
    }

    const data =
        await response.json();

    const results =
        data.results || [];

    /*
     * Score candidates.
     *
     * Important terms are reused
     * instead of recalculated for
     * every paper.
     */
    const scoredResults =
        results.map((paper) => ({
            ...paper,

            relevanceScore:
                calculateRelevanceScore(
                    paper,
                    trimmedTopic,
                    importantTerms
                ),
        }));

    /*
     * Remove weak results and sort
     * strongest results first.
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
     * Return the strongest 25.
     */
    return relevantResults.slice(
        0,
        25
    );
};

const normalizeAcademicPaper = (
    paper
) => {
    const source =
        paper.primary_location?.source;

    const authors =
        (paper.authorships || [])
            .map(
                (authorship) =>
                    authorship.author
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
            paper.cited_by_count || 0,

        isOpenAccess:
            paper.open_access?.is_oa ||
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

module.exports = {
    searchAcademicPapers,
    normalizeAcademicPaper,
};