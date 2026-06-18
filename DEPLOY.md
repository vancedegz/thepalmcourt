# Deploy to Virtualmin

## Overview

This Next.js app is configured for **standalone** output and runs behind an Apache reverse proxy on a Virtualmin server.

---

## 1. One-Time Server Setup

### A. Create Virtual Server in Virtualmin

1. Log into Virtualmin
2. **Create Virtual Server** with your domain
3. Note the home directory (e.g., `/home/pickleball`)

### B. Enable Proxy Pass (Apache)

In Virtualmin, go to **Server Configuration > Website Options** and enable:
- **Proxy to local app server** or edit Apache config manually:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /home/pickleball/public_html

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    <Proxy *>
        Require all granted
    </Proxy>
</VirtualHost>
```

If using SSL (Virtualmin typically auto-configures Let's Encrypt):

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /home/pickleball/public_html

    SSLEngine on
    SSLCertificateFile ...
    SSLCertificateKeyFile ...

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    <Proxy *>
        Require all granted
    </Proxy>
</VirtualHost>
```

Restart Apache:
```bash
sudo systemctl restart apache2
```

### C. Install Node.js on Server

```bash
# Via NodeSource (Node 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### D. Install PM2

```bash
npm install -g pm2
pm2 startup
# Run the command PM2 outputs
```

### E. Database (PostgreSQL)

Ensure PostgreSQL is installed and a database exists:

```bash
sudo -u postgres psql -c "CREATE DATABASE pickleball;"
```

Set the `DATABASE_URL` in your server's `.env` file.

---

## 2. Deploy (Option A: Manual from Windows)

Run the PowerShell script on your local machine:

```powershell
.\deploy.ps1 -Host "yourdomain.com" -User "pickleball" -Path "/home/pickleball/pickleball-courts" -Key "$env:USERPROFILE\.ssh\id_rsa"
```

**Prerequisites:**
- `ssh` and `scp` in PATH (Windows 10/11 has OpenSSH built-in)
- `rsync` optional but recommended (install via Git Bash or WSL)
- SSH key added to server's `~/.ssh/authorized_keys`

---

## 3. Deploy (Option B: GitHub Actions CI/CD)

1. Add these **Repository Secrets** in GitHub:
   - `VM_HOST` — your server IP or domain
   - `VM_USER` — SSH username
   - `VM_SSH_KEY` — private SSH key (contents of `~/.ssh/id_rsa`)
   - `VM_PATH` — remote path (e.g., `/home/pickleball/pickleball-courts`)

2. Push to `main` or `master` branch — it will auto-deploy.

---

## 4. Environment Variables on Server

Create `.env` on the server (never commit it):

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/pickleball"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
UPLOADTHING_TOKEN="..."
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 5. Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs pickleball-courts

# Restart
pm2 reload pickleball-courts

# Stop
pm2 stop pickleball-courts

# Delete
pm2 delete pickleball-courts
```

---

## Troubleshooting

**App won't start:**
- Check `logs/err.log` and `logs/out.log`
- Ensure `DATABASE_URL` is set
- Run `npx prisma migrate deploy` manually

**Images/CSS not loading:**
- Ensure `output: "standalone"` is in `next.config.ts`
- Check Apache ProxyPass is correct

**502 Bad Gateway:**
- Check if PM2 process is running: `pm2 status`
- Check if port 3000 is in use: `netstat -tlnp | grep 3000`
