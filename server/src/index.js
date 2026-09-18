const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    createYoga,
    createSchema,
} = require("graphql-yoga");

const {
    getAuthenticatedUser,
} = require("./middleware/authMiddleware");

const connectDB = require("./config/db");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const app = express();

/* CORS */
app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

app.use(express.json());

/* GraphQL */
const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers,
    }),

    context: async ({ request }) => {
        const authorizationHeader =
            request.headers.get("authorization");

        const user = await getAuthenticatedUser(
            authorizationHeader
        );

        return {
            user,
        };
    },

    maskedErrors: false,
});

app.use("/graphql", yoga);

/* Health check */
app.get("/", (req, res) => {
    res.send("ResearchAI backend is running!");
});

/* Start server */
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `ResearchAI backend running on port ${PORT}`
                );

                console.log(
                    `GraphQL endpoint available at /graphql`
                );
            }
        );
    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();