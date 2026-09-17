const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL;

type GraphQLError = {
    message: string;
};

type GraphQLResponse<T> = {
    data?: T;
    errors?: GraphQLError[];
};

export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    headers?: Record<string, string>
): Promise<T> {
    if (!GRAPHQL_URL) {
        throw new Error("GraphQL URL is not configured");
    }

    try {
        const response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        const result: GraphQLResponse<T> =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.errors?.[0]?.message ||
                    `Server error: ${response.status}`
            );
        }

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message);
        }

        if (!result.data) {
            throw new Error(
                "No data returned from GraphQL server"
            );
        }

        return result.data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }

        throw new Error(
            "Unable to connect to the server. Please try again."
        );
    }
}

/* ---------------------------------- */
/* Authentication                     */
/* ---------------------------------- */

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt?: string;
};

export type SignupResponse = {
    signup: {
        token: string;
        user: AuthUser;
    };
};

export async function signupUser(
    name: string,
    email: string,
    password: string
) {
    const mutation = `
        mutation Signup(
            $name: String!
            $email: String!
            $password: String!
        ) {
            signup(
                name: $name
                email: $email
                password: $password
            ) {
                token
                user {
                    id
                    name
                    email
                    createdAt
                    updatedAt
                }
            }
        }
    `;

    return graphqlRequest<SignupResponse>(
        mutation,
        {
            name,
            email,
            password,
        }
    );
}

export type LoginResponse = {
    login: {
        token: string;
        user: AuthUser;
    };
};

export async function loginUser(
    email: string,
    password: string
) {
    const mutation = `
        mutation Login(
            $email: String!
            $password: String!
        ) {
            login(
                email: $email
                password: $password
            ) {
                token
                user {
                    id
                    name
                    email
                    createdAt
                    updatedAt
                }
            }
        }
    `;

    return graphqlRequest<LoginResponse>(
        mutation,
        {
            email,
            password,
        }
    );
}

export type MeResponse = {
    me: AuthUser;
};

export async function getCurrentUser(
    token: string
) {
    const query = `
        query Me {
            me {
                id
                name
                email
                createdAt
                updatedAt
            }
        }
    `;

    return graphqlRequest<MeResponse>(
        query,
        undefined,
        {
            Authorization: `Bearer ${token}`,
        }
    );
}

/* ---------------------------------- */
/* Academic Papers                    */
/* ---------------------------------- */

export type Paper = {
    id: string;
    researchId: string;
    openAlexId: string;
    title: string;
    abstract: string | null;
    publicationYear: number | null;
    doi: string | null;
    authors: string[];
    journal: string | null;
    sourceUrl: string | null;
    citationCount: number;
    isOpenAccess: boolean;
    evaluationStatus: string;
    aiScore: number | null;
    createdAt: string;
    updatedAt: string;
};

/* ---------------------------------- */
/* Research                           */
/* ---------------------------------- */

export type Research = {
    id: string;
    userId: string;
    title: string;
    status: string;
    papers: Paper[];
    createdAt: string;
    updatedAt: string;
};

export type CreateResearchResponse = {
    createResearch: Research;
};

export async function createResearch(
    title: string,
    token: string
) {
    const mutation = `
        mutation CreateResearch($title: String!) {
            createResearch(title: $title) {
                id
                userId
                title
                status
                papers {
                    id
                }
                createdAt
                updatedAt
            }
        }
    `;

    return graphqlRequest<CreateResearchResponse>(
        mutation,
        {
            title,
        },
        {
            Authorization: `Bearer ${token}`,
        }
    );
}

export type MyResearchResponse = {
    myResearch: Research[];
};

export async function getMyResearch(
    token: string
) {
    const query = `
        query MyResearch {
            myResearch {
                id
                userId
                title
                status
                papers {
                    id
                }
                createdAt
                updatedAt
            }
        }
    `;

    return graphqlRequest<MyResearchResponse>(
        query,
        undefined,
        {
            Authorization: `Bearer ${token}`,
        }
    );
}

/* ---------------------------------- */
/* Search Research Papers             */
/* ---------------------------------- */

export type SearchResearchPapersResponse = {
    searchResearchPapers: {
        researchId: string;
        totalFound: number;
    };
};

export async function searchResearchPapers(
    researchId: string,
    token: string
) {
    const mutation = `
        mutation SearchResearchPapers(
            $researchId: ID!
        ) {
            searchResearchPapers(
                researchId: $researchId
            ) {
                researchId
                totalFound
            }
        }
    `;

    return graphqlRequest<SearchResearchPapersResponse>(
        mutation,
        {
            researchId,
        },
        {
            Authorization: `Bearer ${token}`,
        }
    );
}

/* ---------------------------------- */
/* Get Research Papers                */
/* ---------------------------------- */

export type ResearchPapersResponse = {
    researchPapers: Paper[];
};

export async function getResearchPapers(
    researchId: string,
    token: string
) {
    const query = `
        query ResearchPapers(
            $researchId: ID!
        ) {
            researchPapers(
                researchId: $researchId
            ) {
                id
                researchId
                openAlexId
                title
                abstract
                publicationYear
                doi
                authors
                journal
                sourceUrl
                citationCount
                isOpenAccess
                evaluationStatus
                aiScore
                createdAt
                updatedAt
            }
        }
    `;

    return graphqlRequest<ResearchPapersResponse>(
        query,
        {
            researchId,
        },
        {
            Authorization: `Bearer ${token}`,
        }
    );
}

/* ---------------------------------- */
/* Delete Research                    */
/* ---------------------------------- */

export type DeleteResearchResponse = {
    deleteResearch: boolean;
};

export async function deleteResearch(
    researchId: string,
    token: string
) {
    const mutation = `
        mutation DeleteResearch(
            $researchId: ID!
        ) {
            deleteResearch(
                researchId: $researchId
            )
        }
    `;

    return graphqlRequest<DeleteResearchResponse>(
        mutation,
        {
            researchId,
        },
        {
            Authorization: `Bearer ${token}`,
        }
    );
}