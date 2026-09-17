const conversationalMessages = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "thanks",
    "thank you",
    "help",
];

const validateResearchTopic = (topic) => {
    const trimmedTopic = topic.trim();
    const normalizedTopic = trimmedTopic.toLowerCase();

    if (!trimmedTopic) {
        return {
            valid: false,
            message: "Please enter a research topic.",
        };
    }

    if (trimmedTopic.length < 8) {
        return {
            valid: false,
            message:
                "Please enter a more descriptive research topic.",
        };
    }

    if (conversationalMessages.includes(normalizedTopic)) {
        return {
            valid: false,
            message:
                "Please enter an academic research topic, not a greeting.",
        };
    }

    return {
        valid: true,
        message: "",
    };
};

module.exports = {
    validateResearchTopic,
};