# Deployment Guide - Gold Trading System

## Quick Start Deployment

### 1. Local Development Setup

\`\`\`bash
# Clone repository
git clone <repository-url>
cd gold-trading-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npm run setup-db

# Start backend server (Terminal 1)
npm run server:dev

# Start frontend (Terminal 2)
npm run dev
\`\`\`

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:3000/admin
- Test Suite: http://localhost:3000/test

---

### 2. Production Environment Variables

Create `.env` file for production:

\`\`\`env
# Database
MONGODB_URI=mongodb://your-mongodb-host:27017
DB_NAME=gold_trading_system

# Server
PORT=5000
CLIENT_URL=https://your-domain.com

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this

# API Configuration
MTS_API_URL=https://www.mtsgold.co.th/mtsprice/priceData.php
TRADINGVIEW_API_URL=https://tradingview.mtsgold.co.th/mgb/history

# Optional: Rate limiting, API keys, etc.
\`\`\`

Create `.env.local` for Next.js:

\`\`\`env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
\`\`\`

---

### 3. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

\`\`\`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gold_trading_system?retryWrites=true&w=majority
\`\`\`

#### Option B: Self-Hosted MongoDB

\`\`\`bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017
\`\`\`

---

### 4. Backend Deployment

#### Using PM2 (Recommended)

\`\`\`bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start server/server.js --name gold-trading-api

# Enable auto-restart on system boot
pm2 startup
pm2 save

# View logs
pm2 logs gold-trading-api

# Monitor
pm2 monit
\`\`\`

#### Using Docker

\`\`\`dockerfile
# Dockerfile.backend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server ./server
COPY scripts ./scripts

EXPOSE 5000

CMD ["node", "server/server.js"]
\`\`\`

\`\`\`bash
# Build and run
docker build -t gold-trading-api -f Dockerfile.backend .
docker run -d -p 5000:5000 --env-file .env gold-trading-api
\`\`\`

---

### 5. Frontend Deployment (Vercel)

#### Automatic Deployment

1. Push code to GitHub
2. Import project on https://vercel.com
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL
4. Deploy

#### Manual Deployment

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
\`\`\`

---

### 6. Nginx Reverse Proxy (Optional)

\`\`\`nginx
# /etc/nginx/sites-available/gold-trading

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

Enable and restart:
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/gold-trading /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

---

### 7. SSL/HTTPS Setup

Using Let's Encrypt:

\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
\`\`\`

---

### 8. Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] JWT secret is strong and unique
- [ ] CORS configured for production domains
- [ ] SSL/HTTPS enabled
- [ ] Database indexes created
- [ ] Backup strategy implemented
- [ ] Monitoring setup (PM2, logs)
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] All tests passing

---

### 9. Monitoring & Maintenance

#### Application Monitoring

\`\`\`bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs

# Restart if needed
pm2 restart gold-trading-api
\`\`\`

#### Database Backups

\`\`\`bash
# Manual backup
mongodump --uri="mongodb://localhost:27017/gold_trading_system" --out=/backups/$(date +%Y%m%d)

# Automated daily backups (cron)
0 2 * * * /usr/bin/mongodump --uri="mongodb://localhost:27017/gold_trading_system" --out=/backups/$(date +\%Y\%m\%d)
\`\`\`

#### Health Checks

\`\`\`bash
# API health check
curl http://localhost:5000/health

# Expected response
{"status":"ok","timestamp":"2024-01-20T10:00:00.000Z"}
\`\`\`

---

### 10. Scaling Considerations

#### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Multiple backend instances with PM2 cluster mode:
  \`\`\`bash
  pm2 start server/server.js -i max --name gold-trading-api
  \`\`\`

#### Database Scaling

- Enable MongoDB replica sets
- Implement read replicas
- Use MongoDB sharding for large datasets

#### Caching

- Redis for session management
- Cache frequently accessed prices
- CDN for static assets

---

### 11. Troubleshooting

**Backend not starting:**
- Check MongoDB connection
- Verify port 5000 is available
- Check environment variables

**WebSocket not connecting:**
- Verify CORS configuration
- Check firewall rules
- Ensure WebSocket support in proxy

**High memory usage:**
- Implement connection pooling limits
- Add rate limiting
- Monitor price service intervals

---

### 12. Security Best Practices

- Keep dependencies updated
- Use strong JWT secrets
- Implement rate limiting
- Enable HTTPS only
- Sanitize user inputs
- Use prepared statements for queries
- Implement request validation
- Set up monitoring and alerts
- Regular security audits
- Implement 2FA for admin access

---

## Support

For deployment issues or questions, please refer to:
- Documentation: README.md
- Testing Guide: TESTING.md
- GitHub Issues: Create an issue with deployment logs
