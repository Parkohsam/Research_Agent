const Research = require("../models/research");
const Paper = require("../models/paper");

const {
    searchAcademicPapers,
    normalizeAcademicPaper,
} = require("./academicSearchService");

const searchAndSaveResearchPapers = async (
    researchId
) => {
    const research =
        await Research.findById(
            researchId
        );

    if (!research) {
        throw new Error(
            "Research not found"
        );
    }

    /*
     * Mark the research as searching while
     * OpenAlex is being queried.
     */
    await Research.findByIdAndUpdate(
        researchId,
        {
            status: "searching",
        }
    );

    try {
        /*
         * Search OpenAlex using our improved
         * relevance engine.
         */
        const openAlexPapers =
            await searchAcademicPapers(
                research.title
            );

        /*
         * Normalize the relevant papers.
         */
        const normalizedPapers =
            openAlexPapers.map(
                normalizeAcademicPaper
            );

        /*
         * IMPORTANT:
         *
         * Remove previously stored papers for
         * this research.
         *
         * This prevents old irrelevant results
         * from remaining after we improve the
         * search algorithm.
         */
        await Paper.deleteMany({
            researchId:
                research._id,
        });

        /*
         * Convert papers into MongoDB documents.
         */
        const papersToSave =
            normalizedPapers.map(
                (paper) => ({
                    researchId:
                        research._id,

                    ...paper,
                })
            );

        /*
         * Save the new relevant papers.
         */
        if (
            papersToSave.length > 0
        ) {
            await Paper.insertMany(
                papersToSave
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
            researchId:
                research._id,

            totalFound:
                normalizedPapers.length,
        };
    } catch (error) {
        /*
         * If the search fails, don't leave
         * the research stuck in "searching".
         */
        await Research.findByIdAndUpdate(
            researchId,
            {
                status: "failed",
            }
        );

        throw error;
    }
};

module.exports = {
    searchAndSaveResearchPapers,
};