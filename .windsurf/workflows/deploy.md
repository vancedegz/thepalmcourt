---
description: Deploy the Next.js app to a Virtualmin server
---

# Deploy to Virtualmin

## Prerequisites (Server - One Time)

1. **Create Virtual Server** in Virtualmin with your domain
2. **Enable Proxy Pass** in Apache config:
   ```apache
   ProxyPass / http://localhost:3000/
   ProxyPassReverse / http://localhost:3000/
   ```
3. **Install Node.js 20** on the server
4. **Install PM2**: `npm install -g pm2`
5. **Create `.env`** on the server with `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.

## Deploy from Windows (Manual)

// turbo
1. Run the PowerShell deploy script:
   ```powershell
   .\deploy.ps1 -Host "yourdomain.com" -User "youruser" -Path "/home/youruser/pickleball-courts"
   ```

## Deploy via GitHub Actions (Automatic)

1. Add Repository Secrets in GitHub:
   - `VM_HOST`
   - `VM_USER`
   - `VM_SSH_KEY`
   - `VM_PATH`
2. Push to `main` branch — auto-deploy triggers

## Useful Commands

```bash
pm2 status
pm2 logs pickleball-courts
pm2 reload pickleball-courts
```

See `DEPLOY.md` for full details.
