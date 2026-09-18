const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
    {
        researchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Research",
            required: true,
        },

        openAlexId: {
            type: String,
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        abstract: {
            type: String,
            default: "",
        },

        publicationYear: {
            type: Number,
            default: null,
        },

        doi: {
            type: String,
            default: "",
        },

        authors: {
            type: [String],
            default: [],
        },

        journal: {
            type: String,
            default: "",
        },

        sourceUrl: {
            type: String,
            default: "",
        },

        citationCount: {
            type: Number,
            default: 0,
        },

        isOpenAccess: {
            type: Boolean,
            default: false,
        },

        evaluationStatus: {
            type: String,
            enum: [
                "unevaluated",
                "candidate",
                "rejected",
                "recommended",
            ],
            default: "unevaluated",
        },

        aiScore: {
            type: Number,
            default: null,
        },

        // AI-generated analysis
        aiSummary: {
            type: String,
            default: "",
        },

        aiRelevance: {
            type: String,
            default: "",
        },

        aiKeyFindings: {
            type: [String],
            default: [],
        },

        aiMethodology: {
            type: String,
            default: "",
        },

        aiAnalyzedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paperSchema.index(
    {
        researchId: 1,
        openAlexId: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model("Paper", paperSchema);