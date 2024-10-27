const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors");

const app = express();
const schema = require("../schema");

// allow cross origin requests
app.use(cors());

// graphql set up
app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));

// Use the PORT environment variable
const PORT = process.env.PORT || 4100;

// This console.log is only for local testing
if (process.env.NODE_ENV !== "production") {
	app.listen(PORT, () => {
		console.log(`Listening at port ${PORT}`);
	});
}

// Export the app for Vercel
module.exports = app;
