const { ApolloServer, gql } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");

const typeDefs = gql`
  scalar Date

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
    releaseDate: Date
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

const actors = [
  {
    id: "gordon",
    name: "Gordon Liu",
  },
  {
    id: "bruce",
    name: "Bruce Lee",
  },
];

const movies = [
  {
    id: "321",
    title: "5 Deadly Venoms",
    releaseDate: new Date("10-10-1983"),
    rating: 5,
    actor: [
      {
        id: "bruce",
      },
    ],
  },
  {
    id: "456",
    title: "36 Chambers",
    releaseDate: new Date("8-20-1983"),
    rating: 5,
    actor: [
      {
        id: "gordon",
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

  Movie: {
    actor: (obj, arg, context) => {
      console.log(obj);

      const actorIds = obj.actor.map((actor) => actor.id);
      const filteredActors = actors.filter((actor) => {
        return actorIds.includes(actor.id);
      });
      return filteredActors;
    },
  },

  Date: new GraphQLScalarType({
    name: "Date",
    description: "It's a date, deal with it!",
    parseValue(value) {
      // value from the client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the client
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
    },
  }),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // fixes GET query missing
  playground: true, // fixes GET query missing
});

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ url }) => {
    console.log(`Server started at ${url}`);
  });
