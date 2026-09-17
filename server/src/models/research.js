const mongoose = require("mongoose");

const researchSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },

        papers: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Research = mongoose.model("Research", researchSchema);

module.exports = Research;