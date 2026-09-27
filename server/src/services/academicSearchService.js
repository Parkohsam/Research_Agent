const OPENALEX_API_URL = "https://api.openalex.org/works";

/*
 * Words that usually don't carry useful meaning when
 * determining research-topic relevance.
 */
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
    "application",
    "applications",
    "system",
    "systems",
    "paper",
    "investigate",
    "investigating",
]);

/*
 * Domain vocabulary.
 *
 * This is especially important for topics that combine
 * two or more research areas.
 *
 * Example:
 *
 * "biotechnology + artificial intelligence"
 *
 * requires evidence from BOTH groups.
 */
const DOMAIN_GROUPS = {
    biotechnology: [
        "biotechnology",
        "bioinformatics",
        "genomics",
        "genomic",
        "proteomics",
        "proteomic",
        "molecular biology",
        "molecular biology",
        "synthetic biology",
        "systems biology",
        "computational biology",
        "gene editing",
        "gene sequencing",
        "dna sequencing",
        "rna sequencing",
        "next generation sequencing",
        "ngs",
        "protein engineering",
        "protein structure",
        "bioprocess",
        "bioprocessing",
        "fermentation",
        "metabolic engineering",
        "genetic engineering",
        "genetic modification",
        "gene expression",
        "drug discovery",
        "drug development",
        "biological engineering",
        "cell engineering",
        "cell culture",
        "biomolecule",
        "biomolecular",
    ],

    artificialIntelligence: [
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "neural network",
        "neural networks",
        "computer vision",
        "natural language processing",
        "nlp",
        "reinforcement learning",
        "generative ai",
        "large language model",
        "large language models",
        "llm",
        "transformer",
        "predictive model",
        "predictive modeling",
        "intelligent system",
        "intelligent systems",
        "machine intelligence",
    ],

    healthcare: [
        "healthcare",
        "health care",
        "clinical",
        "medicine",
        "medical",
        "hospital",
        "patient",
        "diagnosis",
        "diagnostic",
        "treatment",
        "public health",
    ],

    agriculture: [
        "agriculture",
        "agricultural",
        "crop",
        "crops",
        "plant",
        "plants",
        "farming",
        "precision agriculture",
        "precision farming",
        "soil",
        "livestock",
        "agronomy",
    ],

    food: [
        "food",
        "food safety",
        "food quality",
        "food processing",
        "food production",
        "foodborne",
        "foodborne disease",
        "food contamination",
    ],

    environment: [
        "environment",
        "environmental",
        "climate",
        "climate change",
        "pollution",
        "ecosystem",
        "biodiversity",
        "water quality",
        "air quality",
    ],

    cybersecurity: [
        "cybersecurity",
        "cyber security",
        "cyber attack",
        "cyber attacks",
        "malware",
        "phishing",
        "network security",
        "information security",
        "intrusion detection",
    ],

    finance: [
        "finance",
        "financial",
        "banking",
        "stock market",
        "investment",
        "credit",
        "fintech",
        "financial market",
    ],
};

/*
 * Normalize text so matching is consistent.
 */
const normalizeText = (text = "") =>
    text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

/*
 * Convert text into useful individual words.
 */
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
 * Reconstruct OpenAlex abstract.
 */
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

/*
 * Check whether a phrase/term exists as a real word or phrase.
 *
 * This prevents things such as:
 *
 * "ai" matching inside another word.
 */
const containsTerm = (text, term) => {
    const normalizedText = normalizeText(text);
    const normalizedTerm = normalizeText(term);

    if (!normalizedText || !normalizedTerm) {
        return false;
    }

    const escapedTerm = normalizedTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const regex = new RegExp(
        `(^|\\s)${escapedTerm}(?=\\s|$)`,
        "i"
    );

    return regex.test(normalizedText);
};

/*
 * Find which domain groups are represented in the
 * user's research topic.
 */
const detectTopicDomains = (topic) => {
    const normalizedTopic = normalizeText(topic);

    const detectedDomains = [];

    for (const [domain, terms] of Object.entries(
        DOMAIN_GROUPS
    )) {
        const matchedTerms = terms.filter((term) =>
            containsTerm(normalizedTopic, term)
        );

        if (matchedTerms.length > 0) {
            detectedDomains.push({
                domain,
                matchedTerms,
            });
        }
    }

    return detectedDomains;
};

/*
 * Build important words and phrases from the user's topic.
 */
const buildImportantTerms = (topic) => {
    const normalizedTopic = normalizeText(topic);

    const words = tokenize(normalizedTopic);

    const phrases = [];

    /*
     * Keep important domain phrases.
     */
    for (const terms of Object.values(DOMAIN_GROUPS)) {
        for (const term of terms) {
            if (containsTerm(normalizedTopic, term)) {
                phrases.push(term);
            }
        }
    }

    /*
     * Add the original topic.
     */
    if (
        normalizedTopic.length >= 8 &&
        !phrases.includes(normalizedTopic)
    ) {
        phrases.push(normalizedTopic);
    }

    /*
     * Generate 2-word phrases.
     */
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;

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
    for (let i = 0; i < words.length - 2; i++) {
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
        phrases: [...new Set(phrases)],
    };
};

/*
 * Determine whether a paper contains evidence for a
 * particular domain.
 */
const getDomainMatch = (text, domainTerms) => {
    const matchedTerms = domainTerms.filter((term) =>
        containsTerm(text, term)
    );

    return {
        matched: matchedTerms.length > 0,
        matchedTerms,
    };
};

/*
 * Calculate how relevant a paper is to the research topic.
 *
 * Important:
 *
 * For multi-domain topics, the paper must demonstrate
 * evidence from the important domains.
 *
 * Example:
 *
 * Topic:
 * "biotechnology and artificial intelligence"
 *
 * Paper:
 * "Artificial Intelligence in Dentistry"
 *
 * AI = YES
 * Biotechnology = NO
 *
 * Therefore the paper is rejected.
 */
const calculateRelevanceScore = (paper, topic) => {
    const title = normalizeText(
        paper.display_name || ""
    );

    const abstract = normalizeText(
        reconstructAbstract(
            paper.abstract_inverted_index
        )
    );

    const combinedText =
        `${title} ${abstract}`.trim();

    if (!combinedText) {
        return {
            score: 0,
            passed: false,
            matchedDomains: [],
            matchedTerms: [],
        };
    }

    const {
        words,
        phrases,
    } = buildImportantTerms(topic);

    const topicDomains =
        detectTopicDomains(topic);

    /*
     * --------------------------------------------------
     * 1. DOMAIN COVERAGE
     * --------------------------------------------------
     */

    const matchedDomains = [];
    const matchedTerms = [];

    for (const domainInfo of topicDomains) {
        const result = getDomainMatch(
            combinedText,
            DOMAIN_GROUPS[domainInfo.domain]
        );

        if (result.matched) {
            matchedDomains.push(
                domainInfo.domain
            );

            matchedTerms.push(
                ...result.matchedTerms
            );
        }
    }

    /*
     * For a multi-domain topic, require all detected
     * domains to be represented.
     *
     * Example:
     *
     * Biotechnology + AI
     *
     * Both must appear conceptually.
     */
    const requiresAllDomains =
        topicDomains.length >= 2;

    if (
        requiresAllDomains &&
        matchedDomains.length <
            topicDomains.length
    ) {
        return {
            score: 0,
            passed: false,
            matchedDomains,
            matchedTerms: [
                ...new Set(matchedTerms),
            ],
        };
    }

    /*
     * --------------------------------------------------
     * 2. TITLE MATCHING
     * --------------------------------------------------
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

    const titleScore =
        words.length > 0
            ? titleMatches / words.length
            : 0;

    /*
     * --------------------------------------------------
     * 3. ABSTRACT / CONTENT MATCHING
     * --------------------------------------------------
     */

    const matchedWords = words.filter(
        (word) =>
            titleWords.has(word) ||
            containsTerm(abstract, word)
    );

    const contentScore =
        words.length > 0
            ? matchedWords.length / words.length
            : 0;

    /*
     * --------------------------------------------------
     * 4. PHRASE MATCHING
     * --------------------------------------------------
     */

    let phraseMatches = 0;

    for (const phrase of phrases) {
        if (
            phrase !== normalizeText(topic) &&
            containsTerm(combinedText, phrase)
        ) {
            phraseMatches++;
        }
    }

    const usablePhrases = phrases.filter(
        (phrase) =>
            phrase !== normalizeText(topic)
    );

    const phraseScore =
        usablePhrases.length > 0
            ? phraseMatches /
              usablePhrases.length
            : 0;

    /*
     * --------------------------------------------------
     * 5. DOMAIN SCORE
     * --------------------------------------------------
     */

    const domainScore =
        topicDomains.length > 0
            ? matchedDomains.length /
              topicDomains.length
            : 0;

    /*
     * --------------------------------------------------
     * 6. EXACT TOPIC MATCH
     * --------------------------------------------------
     */

    const exactTopicMatch =
        containsTerm(
            combinedText,
            normalizeText(topic)
        );

    /*
     * --------------------------------------------------
     * FINAL SCORE
     * --------------------------------------------------
     *
     * Domain coverage receives significant weight.
     * This is what prevents unrelated AI papers from
     * appearing for biotechnology + AI topics.
     */

    let score =
        titleScore * 0.25 +
        contentScore * 0.25 +
        phraseScore * 0.15 +
        domainScore * 0.35;

    /*
     * Small bonus for exact topic match.
     */
    if (exactTopicMatch) {
        score += 0.10;
    }

    score = Math.min(score, 1);

    /*
     * --------------------------------------------------
     * MINIMUM RELEVANCE
     * --------------------------------------------------
     */

    const passed =
        requiresAllDomains
            ? score >= 0.45
            : score >= 0.30;

    return {
        score,
        passed,
        matchedDomains,
        matchedTerms: [
            ...new Set(matchedTerms),
        ],
    };
};

/*
 * Build additional search queries for OpenAlex.
 *
 * The original query is always included.
 */
const buildSearchQueries = (topic) => {
    const normalizedTopic =
        normalizeText(topic);

    const queries = [
        normalizedTopic,
    ];

    const domains =
        detectTopicDomains(normalizedTopic);

    /*
     * Add focused searches for detected domains.
     */
    if (
        domains.some(
            (domain) =>
                domain.domain ===
                "biotechnology"
        ) &&
        domains.some(
            (domain) =>
                domain.domain ===
                "artificialIntelligence"
        )
    ) {
        queries.push(
            "biotechnology artificial intelligence",
            "biotechnology machine learning",
            "bioinformatics artificial intelligence",
            "genomics machine learning",
            "synthetic biology artificial intelligence",
            "computational biology machine learning",
            "protein engineering machine learning",
            "genomics artificial intelligence"
        );
    }

    /*
     * Remove duplicates.
     */
    return [
        ...new Set(
            queries.filter(Boolean)
        ),
    ];
};

/*
 * Search OpenAlex.
 */
const searchAcademicPapers = async (topic) => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
        throw new Error(
            "Research topic is required"
        );
    }

    const searchQueries =
        buildSearchQueries(trimmedTopic);

    /*
     * Search several focused queries instead of
     * depending on one broad OpenAlex query.
     */
    const queryResults =
        await Promise.all(
            searchQueries.map(
                async (searchQuery) => {
                    const url =
                        new URL(
                            OPENALEX_API_URL
                        );

                    url.searchParams.set(
                        "search",
                        searchQuery
                    );

                    url.searchParams.set(
                        "per-page",
                        "50"
                    );

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

                    const response =
                        await fetch(url);

                    if (!response.ok) {
                        throw new Error(
                            `OpenAlex request failed with status ${response.status}`
                        );
                    }

                    const data =
                        await response.json();

                    return data.results || [];
                }
            )
        );

    /*
     * Combine all results.
     */
    const allResults =
        queryResults.flat();

    /*
     * Remove duplicate papers.
     */
    const uniquePapers = new Map();

    for (const paper of allResults) {
        if (
            paper.id &&
            !uniquePapers.has(paper.id)
        ) {
            uniquePapers.set(
                paper.id,
                paper
            );
        }
    }

    /*
     * Score every candidate.
     */
    const scoredResults = [
        ...uniquePapers.values(),
    ].map((paper) => {
        const relevance =
            calculateRelevanceScore(
                paper,
                trimmedTopic
            );

        return {
            ...paper,

            relevanceScore:
                relevance.score,

            relevancePassed:
                relevance.passed,

            matchedDomains:
                relevance.matchedDomains,

            matchedTerms:
                relevance.matchedTerms,
        };
    });

    /*
     * Keep only papers that actually passed
     * our relevance test.
     */
    const relevantResults =
        scoredResults
            .filter(
                (paper) =>
                    paper.relevancePassed
            )
            .sort(
                (a, b) =>
                    b.relevanceScore -
                    a.relevanceScore
            );

    /*
     * Return the strongest 25 papers.
     */
    return relevantResults.slice(
        0,
        25
    );
};

/*
 * Normalize paper for MongoDB.
 */
const normalizeAcademicPaper = (paper) => {
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
        openAlexId: paper.id,

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
            source?.display_name || "",

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