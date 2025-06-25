module.exports = {
  database: {
    path: "../database/thesis.sqlite",
  },
  session: {
    secret: "thesis-management-secret-key",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  },
};
