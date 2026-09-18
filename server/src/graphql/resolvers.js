const {
    registerUser,
    loginUser,
} = require("../services/authService");

const Research = require("../models/research");
const Paper = require("../models/paper");

const {
    searchAcademicPapers,
    normalizeAcademicPaper,
} = require("../services/academicSearchService");

const {
    validateResearchTopic,
} = require("../services/topicValidationService");

const {
    analyzePaperWithAI,
} = require("../services/aiAnalysisService");

const resolvers = {
    User: {
        id: (user) => user._id.toString(),
    },

    Research: {
        id: (research) =>
            research._id.toString(),

        userId: (research) =>
            research.userId.toString(),

        papers: async (research) => {
            return Paper.find({
                researchId: research._id,
            }).sort({
                createdAt: -1,
            });
        },

        createdAt: (research) =>
            research.createdAt.toISOString(),

        updatedAt: (research) =>
            research.updatedAt.toISOString(),
    },

    Paper: {
        id: (paper) =>
            paper._id.toString(),

        researchId: (paper) =>
            paper.researchId.toString(),

        aiAnalyzedAt: (paper) =>
            paper.aiAnalyzedAt
                ? paper.aiAnalyzedAt.toISOString()
                : null,

        createdAt: (paper) =>
            paper.createdAt.toISOString(),

        updatedAt: (paper) =>
            paper.updatedAt.toISOString(),
    },

    Query: {
        hello: () => {
            return "Hello from ResearchAI backend!";
        },

        me: (_, __, context) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            return context.user;
        },

        myResearch: async (_, __, context) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            return Research.find({
                userId: context.user._id,
            }).sort({
                createdAt: -1,
            });
        },

        researchPapers: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const research =
                await Research.findOne({
                    _id: args.researchId,
                    userId: context.user._id,
                });

            if (!research) {
                throw new Error(
                    "Research not found"
                );
            }

            return Paper.find({
                researchId: research._id,
            }).sort({
                createdAt: -1,
            });
        },
    },

    Mutation: {
        signup: async (_, args) => {
            return registerUser(args);
        },

        login: async (_, args) => {
            return loginUser(args);
        },

        createResearch: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const title = args.title.trim();

            const validation =
                validateResearchTopic(title);

            if (!validation.valid) {
                throw new Error(
                    validation.message
                );
            }

            return Research.create({
                userId: context.user._id,
                title,
                status: "pending",
            });
        },

        searchResearchPapers: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const research =
                await Research.findOne({
                    _id: args.researchId,
                    userId: context.user._id,
                });

            if (!research) {
                throw new Error(
                    "Research not found"
                );
            }

            research.status = "processing";
            await research.save();

            try {
                const academicPapers =
                    await searchAcademicPapers(
                        research.title
                    );

                const normalizedPapers =
                    academicPapers.map(
                        normalizeAcademicPaper
                    );

                for (const paper of normalizedPapers) {
                    await Paper.findOneAndUpdate(
                        {
                            researchId:
                                research._id,
                            openAlexId:
                                paper.openAlexId,
                        },
                        {
                            researchId:
                                research._id,
                            ...paper,
                        },
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                        }
                    );
                }

                research.status = "completed";
                await research.save();

                return {
                    researchId:
                        research._id.toString(),

                    totalFound:
                        normalizedPapers.length,
                };
            } catch (error) {
                research.status = "failed";
                await research.save();

                console.error(
                    "Research paper search failed:",
                    error
                );

                throw new Error(
                    "Unable to search and save academic papers."
                );
            }
        },

        /* ---------------------------------- */
        /* AI Paper Analysis                  */
        /* ---------------------------------- */

        analyzePaper: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const paper =
                await Paper.findById(
                    args.paperId
                );

            if (!paper) {
                throw new Error(
                    "Paper not found"
                );
            }

            const research =
                await Research.findOne({
                    _id: paper.researchId,
                    userId: context.user._id,
                });

            if (!research) {
                throw new Error(
                    "You do not have access to this paper."
                );
            }

            try {
                const analysis =
                    await analyzePaperWithAI({
                        researchTopic:
                            research.title,

                        title: paper.title,

                        abstract:
                            paper.abstract,
                    });

                paper.aiScore =
                    analysis.score;

                paper.aiSummary =
                    analysis.summary;

                paper.aiRelevance =
                    analysis.relevance;

                paper.aiKeyFindings =
                    analysis.keyFindings;

                paper.aiMethodology =
                    analysis.methodology;

                paper.aiAnalyzedAt =
                    new Date();

                if (analysis.score >= 80) {
                    paper.evaluationStatus =
                        "recommended";
                } else if (
                    analysis.score >= 60
                ) {
                    paper.evaluationStatus =
                        "candidate";
                } else {
                    paper.evaluationStatus =
                        "rejected";
                }

                await paper.save();

                return {
                    paperId:
                        paper._id.toString(),

                    score:
                        analysis.score,

                    summary:
                        analysis.summary,

                    relevance:
                        analysis.relevance,

                    keyFindings:
                        analysis.keyFindings,

                    methodology:
                        analysis.methodology,
                };
            } catch (error) {
                console.error(
                    "AI paper analysis failed:",
                    error
                );

                throw new Error(
                    error.message ||
                        "Unable to analyze paper with AI."
                );
            }
        },

        /* ---------------------------------- */
        /* Delete Research                    */
        /* ---------------------------------- */

        deleteResearch: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const research =
                await Research.findOne({
                    _id: args.researchId,
                    userId: context.user._id,
                });

            if (!research) {
                throw new Error(
                    "Research not found"
                );
            }

            await Paper.deleteMany({
                researchId: research._id,
            });

            await Research.deleteOne({
                _id: research._id,
            });

            return true;
        },
    },
};

module.exports = resolvers;