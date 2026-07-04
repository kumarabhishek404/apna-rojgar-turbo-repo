/**
 * PM2 process file — same entry as local production: `npm start`
 * (NODE_ENV=production → loads .env then .env.production → LABOUR_APP).
 *
 * Start / reload from apps/backend:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs --update-env
 */
module.exports = {
  apps: [
    {
      name: "apna-rojgar-backend",
      cwd: __dirname,
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      min_uptime: "5s",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
