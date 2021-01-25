const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID!
    title: String!
    releaseDate: String
    rating: Int
    status: Status
    actor: [Actor] # Valid null or [] or [... some data]. Not Valid [... some data without name or id]
    # actor: [Actor]! # Valid [] or [...some data]
    # actor: [Actor!]! # Valid [...some data]
  }

  type Query {
    movies: [Movie]
  }
`;

const movies = [
  {
    title: "5 Deadly Venoms",
    releaseDate: "10-10-1983",
    rating: 5,
  },
  {
    title: "36 Chambers",
    releaseDate: "8-20-1983",
    rating: 5,
  },
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server started at ${url}`);
});
