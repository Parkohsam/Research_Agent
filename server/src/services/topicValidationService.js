const conversationalMessages = new Set([
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
]);

const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "this",
    "to",
    "with",
]);

const validateResearchTopic = (topic) => {
    if (typeof topic !== "string") {
        return {
            valid: false,
            message:
                "Please enter a research topic.",
        };
    }

    const trimmedTopic = topic.trim();

    const normalizedTopic = trimmedTopic
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (!trimmedTopic) {
        return {
            valid: false,
            message:
                "Please enter a research topic.",
        };
    }

    if (trimmedTopic.length < 8) {
        return {
            valid: false,
            message:
                "Please enter a more descriptive research topic.",
        };
    }

    if (
        conversationalMessages.has(
            normalizedTopic
        )
    ) {
        return {
            valid: false,
            message:
                "Please enter an academic research topic, not a greeting.",
        };
    }

    const words = normalizedTopic
        .split(/\s+/)
        .map((word) =>
            word.replace(
                /[^\p{L}\p{N}-]/gu,
                ""
            )
        )
        .filter(
            (word) =>
                word.length >= 3 &&
                !STOP_WORDS.has(word)
        );

    if (words.length < 2) {
        return {
            valid: false,
            message:
                "Please enter a more specific academic research topic.",
        };
    }

    /*
     * Reject obvious conversational questions that are not
     * research topics.
     */
    const conversationalPatterns = [
        /^what is /i,
        /^who is /i,
        /^where is /i,
        /^when is /i,
        /^how are /i,
        /^can you /i,
        /^tell me /i,
    ];

    const looksConversational =
        conversationalPatterns.some(
            (pattern) =>
                pattern.test(trimmedTopic)
        );

    if (looksConversational) {
        return {
            valid: false,
            message:
                "Please enter a research topic rather than a general question.",
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