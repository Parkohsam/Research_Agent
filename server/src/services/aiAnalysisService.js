const LOCAL_OLLAMA_URL =
    "http://127.0.0.1:11434/api/generate";

const CLOUD_OLLAMA_URL =
    "https://ollama.com/api/generate";

const LOCAL_MODEL =
    process.env.OLLAMA_LOCAL_MODEL ||
    "qwen2.5:3b";

const CLOUD_MODEL =
    process.env.OLLAMA_MODEL ||
    "gpt-oss:20b-cloud";

const isProduction =
    process.env.NODE_ENV === "production";

const analyzePaperWithAI = async ({
    researchTopic,
    title,
    abstract,
}) => {
    if (!abstract || !abstract.trim()) {
        throw new Error(
            "This paper does not have an abstract available for AI analysis."
        );
    }

    const prompt = `
You are an academic research assistant.

Analyze the following academic paper in relation to the user's research topic.

USER RESEARCH TOPIC:
${researchTopic}

PAPER TITLE:
${title}

PAPER ABSTRACT:
${abstract.substring(0, 8000)}

Return ONLY valid JSON with this exact structure:

{
  "score": 0,
  "summary": "A concise summary of the paper.",
  "relevance": "Explain why the paper is relevant or not relevant to the research topic.",
  "keyFindings": [
    "Important finding 1",
    "Important finding 2",
    "Important finding 3"
  ],
  "methodology": "Describe the research method used, if it can be determined from the abstract."
}

Rules:

- score must be a number from 0 to 100.
- 80-100 means highly relevant.
- 60-79 means moderately relevant.
- 40-59 means somewhat relevant.
- 0-39 means low relevance.
- Do not invent information that is not supported by the abstract.
- If the methodology cannot be determined, say "Not clearly stated in the abstract."
- Keep the summary concise.
- Return JSON only.
`;

    const ollamaUrl = isProduction
        ? CLOUD_OLLAMA_URL
        : LOCAL_OLLAMA_URL;

    const model = isProduction
        ? CLOUD_MODEL
        : LOCAL_MODEL;

    const headers = {
        "Content-Type": "application/json",
    };

    if (isProduction) {
        const apiKey =
            process.env.OLLAMA_API_KEY;

        if (!apiKey) {
            throw new Error(
                "OLLAMA_API_KEY is not configured."
            );
        }

        headers.Authorization =
            `Bearer ${apiKey}`;
    }

    console.log(
        `AI analysis using ${isProduction ? "Ollama Cloud" : "local Ollama"}`
    );

    const response = await fetch(
        ollamaUrl,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.2,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText =
            await response.text();

        console.error(
            "Ollama API error:",
            errorText
        );

        throw new Error(
            "Unable to connect to the AI model."
        );
    }

    const result =
        await response.json();

    if (!result.response) {
        throw new Error(
            "The AI model returned an empty response."
        );
    }

    let analysis;

    try {
        analysis = JSON.parse(
            result.response
        );
    } catch (error) {
        console.error(
            "Failed to parse AI response:",
            result.response
        );

        throw new Error(
            "The AI model returned an invalid analysis."
        );
    }

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

    return {
        score,

        summary:
            typeof analysis.summary ===
            "string"
                ? analysis.summary
                : "",

        relevance:
            typeof analysis.relevance ===
            "string"
                ? analysis.relevance
                : "",

        keyFindings:
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
                : [],

        methodology:
            typeof analysis.methodology ===
            "string"
                ? analysis.methodology
                : "",
    };
};

module.exports = {
    analyzePaperWithAI,
};