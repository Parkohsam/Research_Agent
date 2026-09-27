const Research = require("../models/research");
const Paper = require("../models/paper");

const {
    searchAcademicPapers,
    normalizeAcademicPaper,
} = require("./academicSearchService");

const searchAndSaveResearchPapers = async (researchId) => {
    const research = await Research.findById(researchId);

    if (!research) {
        throw new Error("Research not found");
    }

    /*
     * Search OpenAlex and apply our relevance filtering.
     */
    const openAlexPapers = await searchAcademicPapers(
        research.title
    );

    const normalizedPapers =
        openAlexPapers.map(normalizeAcademicPaper);

    /*
     * Convert papers into MongoDB documents.
     */
    const papersToSave = normalizedPapers.map(
        (paper) => ({
            researchId: research._id,
            ...paper,
        })
    );

    /*
     * Save/update papers.
     */
    if (papersToSave.length > 0) {
        await Paper.bulkWrite(
            papersToSave.map((paper) => ({
                updateOne: {
                    filter: {
                        researchId:
                            paper.researchId,

                        openAlexId:
                            paper.openAlexId,
                    },

                    update: {
                        $set: paper,
                    },

                    upsert: true,
                },
            }))
        );
    }

    /*
     * Mark research as completed.
     */
    await Research.findByIdAndUpdate(
        researchId,
        {
            status: "completed",
        }
    );

    return {
        researchId: research._id,

        totalFound:
            normalizedPapers.length,
    };
};

module.exports = {
    searchAndSaveResearchPapers,
};