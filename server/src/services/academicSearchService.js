const OPENALEX_API_URL = "https://api.openalex.org/works";

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

const searchAcademicPapers = async (topic) => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
        throw new Error("Research topic is required");
    }

    const url = new URL(OPENALEX_API_URL);

    url.searchParams.set("search", trimmedTopic);
    url.searchParams.set("per-page", "25");

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

    return data.results || [];
};

const normalizeAcademicPaper = (paper) => {
    const source = paper.primary_location?.source;

    const authors = (paper.authorships || [])
        .map((authorship) => authorship.author?.display_name)
        .filter(Boolean);

    return {
        openAlexId: paper.id,

        title: paper.display_name || "Untitled paper",

        abstract: reconstructAbstract(
            paper.abstract_inverted_index
        ),

        publicationYear: paper.publication_year || null,

        doi: paper.doi || "",

        authors,

        journal: source?.display_name || "",

        sourceUrl:
            paper.primary_location?.landing_page_url ||
            paper.primary_location?.pdf_url ||
            "",

        citationCount: paper.cited_by_count || 0,

        isOpenAccess: paper.open_access?.is_oa || false,
    };
};

module.exports = {
    searchAcademicPapers,
    normalizeAcademicPaper,
};