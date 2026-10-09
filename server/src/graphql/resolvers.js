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
        id: (user) =>
            user._id.toString(),

        createdAt: (user) =>
            user.createdAt.toISOString(),

        updatedAt: (user) =>
            user.updatedAt.toISOString(),
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
                relevanceScore: -1,
                citationCount: -1,
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

        createdAt: (paper) =>
            paper.createdAt.toISOString(),

        updatedAt: (paper) =>
            paper.updatedAt.toISOString(),

        aiAnalyzedAt: (paper) =>
            paper.aiAnalyzedAt
                ? paper.aiAnalyzedAt.toISOString()
                : null,
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

            const page = Math.max(
                Number(args.page) || 1,
                1
            );

            const limit = Math.min(
                Math.max(
                    Number(args.limit) || 5,
                    1
                ),
                20
            );

            const skip =
                (page - 1) * limit;

            const [
                papers,
                total,
            ] = await Promise.all([
                Paper.find({
                    researchId:
                        research._id,
                })
                    .sort({
                        relevanceScore: -1,
                        citationCount: -1,
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limit),

                Paper.countDocuments({
                    researchId:
                        research._id,
                }),
            ]);

            return {
                papers,
                total,
                page,
                limit,
                hasMore:
                    skip + papers.length <
                    total,
            };
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

            const title =
                args.title.trim();

            const validation =
                validateResearchTopic(
                    title
                );

            if (!validation.valid) {
                throw new Error(
                    validation.message
                );
            }

            return Research.create({
                userId:
                    context.user._id,
                title,
                status: "pending",
            });
        },


        searchResearchPapers: async (_, args, context) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const research = await Research.findOne({
                _id: args.researchId,
                userId: context.user._id,
            });

            if (!research) {
                throw new Error("Research not found");
            }

            research.status = "processing";
            await research.save();

            try {
                console.log(
                    "Starting academic paper search:",
                    research.title
                );

                const academicPapers =
                    await searchAcademicPapers(research.title);

                const normalizedPapers =
                    academicPapers.map(normalizeAcademicPaper);

                console.log(
                    `OpenAlex returned ${normalizedPapers.length} relevant papers.`
                );

                if (normalizedPapers.length > 0) {
                    await Paper.bulkWrite(
                        normalizedPapers.map((paper) => ({
                            updateOne: {
                                filter: {
                                    researchId: research._id,
                                    openAlexId: paper.openAlexId,
                                },
                                update: {
                                    $set: {
                                        researchId: research._id,
                                        ...paper,
                                    },
                                },
                                upsert: true,
                            },
                        })),
                        { ordered: false }
                    );
                }

                research.status = "completed";
                await research.save();

                console.log(
                    `Paper search completed for research ${research._id}.`
                );

                return {
                    researchId: research._id.toString(),
                    totalFound: normalizedPapers.length,
                };
            } catch (error) {
                console.error(
                    "Research paper search failed:",
                    error
                );

                research.status = "failed";
                await research.save();

                throw new Error(
                    error instanceof Error
                        ? error.message
                        : "Unable to search and save academic papers."
                );
            }
        },


        analyzePaper: async (
            _,
            args,
            context
        ) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            if (!args.paperId) {
                throw new Error(
                    "Paper ID is required."
                );
            }

            const paper =
                await Paper.findById(
                    args.paperId
                );

            if (!paper) {
                throw new Error(
                    "Paper not found."
                );
            }

            const research =
                await Research.findOne({
                    _id: paper.researchId,
                    userId: context.user._id,
                });

            if (!research) {
                throw new Error(
                    "You are not authorized to analyze this paper."
                );
            }

            if (
                !paper.abstract ||
                !paper.abstract.trim()
            ) {
                throw new Error(
                    "This paper does not have an abstract available for AI analysis."
                );
            }

            try {
                const analysis =
                    await analyzePaperWithAI({
                        researchTopic:
                            research.title,

                        title:
                            paper.title,

                        abstract:
                            paper.abstract,
                    });

                const score =
                    Number(analysis.score);

                if (
                    Number.isNaN(score) ||
                    score < 0 ||
                    score > 100
                ) {
                    throw new Error(
                        "The AI returned an invalid relevance score."
                    );
                }

                paper.aiScore = score;

                paper.aiSummary =
                    typeof analysis.summary ===
                        "string"
                        ? analysis.summary
                        : "";

                paper.aiRelevance =
                    typeof analysis.relevance ===
                        "string"
                        ? analysis.relevance
                        : "";

                paper.aiKeyFindings =
                    Array.isArray(
                        analysis.keyFindings
                    )
                        ? analysis.keyFindings
                            .filter(
                                (finding) =>
                                    typeof finding ===
                                    "string"
                            )
                            .slice(0, 5)
                        : [];

                paper.aiMethodology =
                    typeof analysis.methodology ===
                        "string"
                        ? analysis.methodology
                        : "";

                paper.aiAnalyzedAt =
                    new Date();

                if (score >= 80) {
                    paper.evaluationStatus =
                        "recommended";
                } else if (score >= 60) {
                    paper.evaluationStatus =
                        "candidate";
                } else {
                    paper.evaluationStatus =
                        "rejected";
                }

                await paper.save();

                return {
                    paperId: paper._id
                        ? paper._id.toString()
                        : String(args.paperId),

                    score,

                    summary:
                        paper.aiSummary,

                    relevance:
                        paper.aiRelevance,

                    keyFindings:
                        paper.aiKeyFindings,

                    methodology:
                        paper.aiMethodology,

                    analyzedAt:
                        paper.aiAnalyzedAt
                            ? paper.aiAnalyzedAt.toISOString()
                            : null,
                };
            } catch (error) {
                console.error(
                    "Paper AI analysis failed:",
                    error
                );

                throw new Error(
                    error instanceof Error
                        ? error.message
                        : "Unable to analyze paper with AI."
                );
            }
        },

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
                researchId:
                    research._id,
            });

            await Research.deleteOne({
                _id: research._id,
            });

            return true;
        },
    },
};

module.exports = resolvers;