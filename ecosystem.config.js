module.exports = {
  apps: [
    {
      name: "cattyshack-web",
      cwd: "./apps/web",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "../../logs/web-error.log",
      out_file: "../../logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "cattyshack-events",
      cwd: "./apps/event-service",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "../../logs/events-error.log",
      out_file: "../../logs/events-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
