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

const resolvers = {
    User: {
        id: (user) => user._id.toString(),
    },

    Research: {
        id: (research) => research._id.toString(),

        userId: (research) => research.userId.toString(),

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
        id: (paper) => paper._id.toString(),

        researchId: (paper) =>
            paper.researchId.toString(),

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

        researchPapers: async (_, args, context) => {
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

        createResearch: async (_, args, context) => {
            if (!context.user) {
                throw new Error("Unauthorized");
            }

            const title = args.title.trim();

            if (!title) {
                throw new Error("Research title is required");
            }

            return Research.create({
                userId: context.user._id,
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
                            researchId: research._id,
                            openAlexId: paper.openAlexId,
                        },
                        {
                            researchId: research._id,
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
                    researchId: research._id.toString(),
                    totalFound: normalizedPapers.length,
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
    },
};

module.exports = resolvers;