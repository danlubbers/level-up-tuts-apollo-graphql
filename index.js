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
    movie(id: ID): Movie
  }
`;

const movies = [
  {
    id: "321",
    title: "5 Deadly Venoms",
    releaseDate: "10-10-1983",
    rating: 5,
  },
  {
    id: "456",
    title: "36 Chambers",
    releaseDate: "8-20-1983",
    rating: 5,
    actor: [
      {
        id: "123",
        name: "Bruce Lee",
      },
    ],
  },
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (obj, { id }, context, info) => {
      const foundMovie = movies.find((movie) => {
        return movie.id === id;
      });
      return foundMovie;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ url }) => {
    console.log(`Server started at ${url}`);
  });
