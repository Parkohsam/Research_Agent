const OPENALEX_API_URL = "https://api.openalex.org/works";

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
    const normalizedTopic = normalizeText(topic);

    const words = tokenize(normalizedTopic);

    const phrases = [];

    // Keep the original topic as a phrase.
    if (normalizedTopic.length >= 8) {
        phrases.push(normalizedTopic);
    }

    // Generate useful 2-word phrases.
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;

        if (
            phrase.length >= 8 &&
            !phrases.includes(phrase)
        ) {
            phrases.push(phrase);
        }
    }

    // Generate useful 3-word phrases.
    for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

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

const reconstructAbstract = (abstractInvertedIndex) => {
    if (!abstractInvertedIndex) {
        return "";
    }

    const words = [];

    for (const [word, positions] of Object.entries(
        abstractInvertedIndex
    )) {
        for (const position of positions) {
            words[position] = word;
        }
    }

    return words.filter(Boolean).join(" ");
};

const calculateRelevanceScore = (paper, topic) => {
    const title = normalizeText(paper.display_name || "");

    const abstract = normalizeText(
        reconstructAbstract(paper.abstract_inverted_index)
    );

    const combinedText = `${title} ${abstract}`;

    const { words, phrases } = buildImportantTerms(topic);

    if (!combinedText.trim()) {
        return 0;
    }

    let score = 0;

    /*
     * TITLE MATCHING
     *
     * A term appearing in the title is much more important
     * than the same term appearing somewhere in the abstract.
     */
    const titleWords = new Set(tokenize(title));

    let titleMatches = 0;

    for (const word of words) {
        if (titleWords.has(word)) {
            titleMatches++;
        }
    }

    if (words.length > 0) {
        score +=
            (titleMatches / words.length) * 0.45;
    }

    /*
     * ABSTRACT / FULL TEXT MATCHING
     */
    const matchedWords = words.filter((word) =>
        combinedText.includes(word)
    );

    if (words.length > 0) {
        score +=
            (matchedWords.length / words.length) * 0.3;
    }

    /*
     * PHRASE MATCHING
     *
     * Matching "food safety", "real-time monitoring",
     * "machine learning", etc. is stronger than matching
     * isolated words.
     */
    let phraseMatches = 0;

    for (const phrase of phrases) {
        if (
            phrase !== normalizeText(topic) &&
            combinedText.includes(phrase)
        ) {
            phraseMatches++;
        }
    }

    const usablePhrases = phrases.filter(
        (phrase) => phrase !== normalizeText(topic)
    );

    if (usablePhrases.length > 0) {
        score +=
            (phraseMatches / usablePhrases.length) * 0.2;
    }

    /*
     * EXACT TOPIC MATCH
     */
    if (combinedText.includes(normalizeText(topic))) {
        score += 0.15;
    }

    /*
     * Keep score between 0 and 1.
     */
    return Math.min(score, 1);
};

const searchAcademicPapers = async (topic) => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
        throw new Error("Research topic is required");
    }

    const url = new URL(OPENALEX_API_URL);

    /*
     * Ask OpenAlex for a larger candidate pool.
     *
     * We intentionally don't stop at 25 because our own
     * relevance filter will determine the final 25.
     */
    url.searchParams.set("search", trimmedTopic);
    url.searchParams.set("per-page", "100");

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

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `OpenAlex request failed with status ${response.status}`
        );
    }

    const data = await response.json();

    const results = data.results || [];

    /*
     * Calculate relevance for every candidate.
     */
    const scoredResults = results.map((paper) => ({
        ...paper,
        relevanceScore: calculateRelevanceScore(
            paper,
            trimmedTopic
        ),
    }));

    /*
     * Remove papers that have very weak relevance.
     *
     * 0.25 is deliberately not extremely strict because
     * academic titles/abstracts can use different terminology.
     */
    const relevantResults = scoredResults
        .filter((paper) => paper.relevanceScore >= 0.25)
        .sort(
            (a, b) =>
                b.relevanceScore - a.relevanceScore
        );

    /*
     * Return the strongest 25 papers.
     */
    return relevantResults.slice(0, 25);
};

const normalizeAcademicPaper = (paper) => {
    const source = paper.primary_location?.source;

    const authors = (paper.authorships || [])
        .map(
            (authorship) =>
                authorship.author?.display_name
        )
        .filter(Boolean);

    return {
        openAlexId: paper.id,

        title:
            paper.display_name ||
            "Untitled paper",

        abstract: reconstructAbstract(
            paper.abstract_inverted_index
        ),

        publicationYear:
            paper.publication_year || null,

        doi: paper.doi || "",

        authors,

        journal:
            source?.display_name || "",

        sourceUrl:
            paper.primary_location?.landing_page_url ||
            paper.primary_location?.pdf_url ||
            "",

        citationCount:
            paper.cited_by_count || 0,

        isOpenAccess:
            paper.open_access?.is_oa || false,

        relevanceScore:
            Number(
                (paper.relevanceScore || 0).toFixed(3)
            ),
    };
};

module.exports = {
    searchAcademicPapers,
    normalizeAcademicPaper,
};