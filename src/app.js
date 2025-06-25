const express = require("express");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const routes = require("./routes");
const { seedDatabase } = require("./db/seedData");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Setup session middleware
app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: path.join(__dirname, "../database"),
    }),
    secret: "thesis-management-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

// Use routes
app.use("/", routes);

// Initialize the database and start the server
async function startServer() {
  try {
    // Seed the database with initial data
    await seedDatabase();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to access the application`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
