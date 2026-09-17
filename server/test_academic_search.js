require("dotenv").config();

const {
    searchAcademicPapers,
} = require("./src/services/academicSearchService");

const testSearch = async () => {
    try {
        const papers = await searchAcademicPapers(
            "Artificial Intelligence-Enabled Sensors for Real-Time Monitoring of Food Quality and Safety"
        );

        console.log(`Papers returned: ${papers.length}`);

        console.log(
            papers.slice(0, 3).map((paper) => ({
                id: paper.id,
                title: paper.display_name,
                year: paper.publication_year,
                doi: paper.doi,
                citations: paper.cited_by_count,
            }))
        );
    } catch (error) {
        console.error("Academic search failed:", error.message);
    }
};

testSearch();