const typeDefs = `
    type User {
        id: ID!
        name: String!
        email: String!
        createdAt: String!
        updatedAt: String!
    }

    type Research {
        id: ID!
        userId: ID!
        title: String!
        status: String!
        papers: [Paper!]!
        createdAt: String!
        updatedAt: String!
    }

    type Paper {
        id: ID!
        researchId: ID!
        openAlexId: String!
        title: String!
        abstract: String
        publicationYear: Int
        doi: String
        authors: [String!]!
        journal: String
        sourceUrl: String
        citationCount: Int!
        isOpenAccess: Boolean!
        evaluationStatus: String!
        aiScore: Float

        aiSummary: String
        aiRelevance: String
        aiKeyFindings: [String!]!
        aiMethodology: String
        aiAnalyzedAt: String

        createdAt: String!
        updatedAt: String!
    }

    type ResearchSearchResult {
        researchId: ID!
        totalFound: Int!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type PaperAIAnalysis {
        paperId: ID!
        score: Float!
        summary: String!
        relevance: String!
        keyFindings: [String!]!
        methodology: String!
    }

    type Query {
        hello: String
        me: User
        myResearch: [Research!]!
        researchPapers(researchId: ID!): [Paper!]!
    }

    type Mutation {
        signup(
            name: String!
            email: String!
            password: String!
        ): AuthPayload!

        login(
            email: String!
            password: String!
        ): AuthPayload!

        createResearch(
            title: String!
        ): Research!

        searchResearchPapers(
            researchId: ID!
        ): ResearchSearchResult!

        analyzePaper(
            paperId: ID!
        ): PaperAIAnalysis!

        deleteResearch(
            researchId: ID!
        ): Boolean!
    }
`;

module.exports = typeDefs;