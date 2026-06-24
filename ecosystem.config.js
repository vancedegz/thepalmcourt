require("dotenv").config({ path: __dirname + "/.env" });

module.exports = {
  apps: [{
    name: "pickleball-courts",
    script: "./.next/standalone/server.js",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3001,
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
  }],
}
