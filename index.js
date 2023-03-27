const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors");

const app = express();

const schema = require("./schema");

// allow cross origin requests
app.use(cors());

// graphql set up
app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));

app.listen(4100, () => {
	console.log("Listening at port 4100");
});
