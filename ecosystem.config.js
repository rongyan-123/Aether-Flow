module.exports = {
  apps: [
    {
      name: "my-backend",
      script: "./server/server.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
