const { ApolloServer, gql, PubSub } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.haie3.mongodb.net/<dbname>?retryWrites=true&w=majority`,
  { useNewUrlParser: true }
);
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String],
});

const Movie = mongoose.model("Movie", movieSchema);

// gql`` parses your string into an AST - see 'what-is-an-ast.md'
const typeDefs = gql`
  fragment Meta on Movie {
    releaseDate
    rating
  }

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

  # Schema
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

  input ActorInput {
    id: ID
    name: String
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
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

const pubsub = new PubSub();
const MOVIE_ADDED = "MOVIE_ADDED";

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => {
        return pubsub.asyncIterator([MOVIE_ADDED]);
      },
    },
  },

  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find();
        return allMovies;
      } catch (error) {
        console.log("movies", error);
        return [];
      }
    },
    movie: async (obj, { id }, context, info) => {
      try {
        const foundMovie = await Movie.findById(id);
        return foundMovie;
      } catch (error) {
        console.log("allmovies", error);
        return {};
      }
    },
  },

  Movie: {
    actor: (obj, args, context) => {
      console.log(obj);

      const actorIds = obj.actor.map((actor) => actor.id);
      const filteredActors = actors.filter((actor) => {
        return actorIds.includes(actor.id);
      });
      return filteredActors;
    },
  },

  Mutation: {
    addMovie: async (obj, { movie }, context) => {
      try {
        const newMovie = await Movie.create({
          ...movie,
        });
        pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie });
        return [newMovie];

        // console.log("context", context);
        // // Do mutation and/or database stuff
        // const newMoviesList = [
        //   ...movies,
        //   // new movie data goes here, comes from destructured args
        //   movie,
        // ];
        // // Return data as expected in schema
        // return newMoviesList;
      } catch (error) {
        console.log("addMovie", error);
        return [];
      }
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
  context: ({ req }) => {
    const fakeUser = {
      useId: "Fake User ID",
    };
    return { ...fakeUser };
  },
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
  console.log("✅ database connected! ✅");

  server
    .listen({
      port: process.env.PORT || 4000,
    })
    .then(({ url }) => {
      console.log(`Server started at ${url}`);
    });
});
