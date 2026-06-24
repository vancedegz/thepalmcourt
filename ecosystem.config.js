module.exports = {
  apps: [{
    name: "pickleball-courts",
    script: "./.next/standalone/server.js",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3001,
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
  }],
}
