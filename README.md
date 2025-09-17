# Assurnet Orchestration - Server Monitoring & Management Platform

A comprehensive server monitoring and restart management application with a modern web interface, designed specifically for enterprise server infrastructure management.

## 🚀 Features

- **Real-time Dashboard** with automatic monitoring and live updates
- **Complete Server Management** (CRUD) with advanced configuration options
- **Robust Authentication System** with role-based permissions
- **Comprehensive Logging & Audit** trail for all operations
- **Automated Email Alerts** for server outages and issues
- **Advanced Task Scheduling** with email notifications
- **Flexible Server Selection** for restart operations with group management
- **Data Export Functionality** for monitoring reports
- **Secure REST API** with JWT authentication

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: WebSocket connections
- **Email**: Nodemailer with SMTP
- **Containerization**: Docker + Docker Compose

## 📋 Prerequisites

- **Operating System**: Oracle Linux 8.10 (or compatible)
- **Docker**: Version 26.1.3 or higher
- **Docker Compose**: Latest version
- **SSH Access**: Configured for target servers
- **Email Account**: Microsoft 365 or compatible SMTP

## 🔧 Installation & Setup

### 1. Clone and Prepare

```bash
# Navigate to your deployment directory
cd /opt/
git clone <repository-url> assurnet-orchestration
cd assurnet-orchestration
```

### 2. Environment Configuration

Create and configure the `.env` file:

```bash
# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=server_monitor
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT Security (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# SMTP Configuration (Microsoft 365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
ADMIN_EMAILS=admin@company.com,it@company.com

# API Configuration
VITE_API_URL=http://your-server-ip:5000
```

### 3. SSH Configuration for Server Access

```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096 -f ~/.ssh/assurnet_key

# Copy public key to target servers
for server in server1 server2 server3; do
    ssh-copy-id -i ~/.ssh/assurnet_key.pub root@$server
done

# Test connections
ssh -i ~/.ssh/assurnet_key root@server1 "echo 'Connection successful'"
```

### 4. Deploy the Application

```bash
# Build and start all services
docker compose up -d --build

# Initialize database with sample data
docker compose exec backend node seed.js

# Verify services are running
docker compose ps
```

### 5. Access the Application

- **Web Interface**: http://your-server-ip:3000
- **API Endpoint**: http://your-server-ip:5000/api
- **Database**: localhost:5432 (internal)

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

## 🏗 Architecture Overview

### Backend Services

- **Authentication Service**: JWT-based with role permissions
- **Monitoring Service**: Real-time ping/telnet checks every minute
- **Restart Service**: SSH-based server restart with ordering
- **Scheduler Service**: Cron-based task scheduling
- **Email Service**: SMTP notifications and alerts
- **WebSocket Service**: Real-time updates to frontend

### Database Schema

- **Users**: Authentication and permissions
- **Servers**: Server configurations and status
- **MonitorLogs**: Historical monitoring data
- **RestartLogs**: Restart operation history
- **ScheduledTasks**: Planned maintenance tasks

### Frontend Components

- **Dashboard**: Real-time overview and statistics
- **Server Management**: CRUD operations for servers
- **Monitoring**: Live status and historical data
- **Restart Management**: Interactive server restart interface
- **Scheduler**: Task planning and management
- **User Management**: Admin user controls
- **Logs & Audit**: Comprehensive activity tracking

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Ping/Monitoring Not Working

**Symptoms**: Servers always show as offline, ping failures

**Solutions**:
```bash
# Check network connectivity from container
docker compose exec backend ping -c 1 your-server-ip

# Verify container networking
docker network ls
docker network inspect assurnet-orchestration_app-network

# Check firewall rules
sudo firewall-cmd --list-all
```

#### 2. SSH Restart Failures

**Symptoms**: "Server is not reachable" or SSH connection errors

**Solutions**:
```bash
# Test SSH from container
docker compose exec backend ssh -o StrictHostKeyChecking=no root@server-ip "echo test"

# Check SSH key permissions
ls -la ~/.ssh/
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Verify SSH agent
ssh-add ~/.ssh/id_rsa
```

#### 3. User Registration Issues

**Symptoms**: Cannot create new users

**Solutions**:
- Ensure you're logged in as admin
- Check user permissions in the database
- Verify JWT token validity

#### 4. Scheduler Time Issues

**Symptoms**: Tasks scheduled for wrong time

**Solutions**:
```bash
# Check container timezone
docker compose exec backend date
docker compose exec backend timedatectl

# Set correct timezone in docker-compose.yml
environment:
  - TZ=Africa/Tunis
```

#### 5. Email Notifications Not Working

**Symptoms**: No alert emails received

**Solutions**:
```bash
# Test SMTP configuration
docker compose exec backend node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: { user: 'your-email', pass: 'your-password' }
});
transporter.verify().then(console.log).catch(console.error);
"
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Monitor resource usage
docker stats
```

### Database Maintenance

```bash
# Backup database
docker compose exec database pg_dump -U postgres server_monitor > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T database psql -U postgres server_monitor < backup_file.sql

# Clean old logs (optional)
docker compose exec database psql -U postgres server_monitor -c "
DELETE FROM MonitorLogs WHERE createdAt < NOW() - INTERVAL '30 days';
DELETE FROM RestartLogs WHERE createdAt < NOW() - INTERVAL '90 days';
"
```

### Performance Optimization

```bash
# Optimize Docker images
docker system prune -a

# Update application
git pull
docker compose down
docker compose up -d --build

# Monitor disk usage
df -h
docker system df
```

## 🔒 Security Considerations

### Production Hardening

1. **Change Default Credentials**
   ```bash
   # Update admin password immediately
   # Use strong JWT secrets
   # Rotate SSH keys regularly
   ```

2. **Network Security**
   ```bash
   # Configure firewall rules
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --permanent --add-port=5000/tcp
   sudo firewall-cmd --reload
   ```

3. **SSL/TLS Configuration**
   ```bash
   # Add reverse proxy with SSL
   # Use Let's Encrypt certificates
   # Enable HTTPS redirects
   ```

## 📈 Scaling & High Availability

### Load Balancing

```yaml
# docker-compose.prod.yml
services:
  frontend:
    deploy:
      replicas: 2
  backend:
    deploy:
      replicas: 3
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
```

### Database Clustering

```yaml
# Add read replicas
database-replica:
  image: postgres:15
  environment:
    POSTGRES_MASTER_SERVICE: database
```

## 🆘 Support & Contact

### Getting Help

1. **Check Logs First**
   ```bash
   docker compose logs --tail=100 backend
   ```

2. **Common Log Locations**
   - Application logs: `./logs/combined.log`
   - Error logs: `./logs/error.log`
   - Database logs: Docker container logs

3. **Debug Mode**
   ```bash
   # Enable debug logging
   docker compose exec backend npm run dev
   ```

### System Requirements

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Network**: Stable connection to target servers
- **Ports**: 3000 (web), 5000 (api), 5432 (database)

## 🔄 Migration from Legacy Scripts

This application replaces traditional bash scripts with:

- **Web-based interface** instead of command-line
- **Real-time monitoring** instead of manual checks
- **Scheduled operations** instead of cron jobs
- **Audit logging** instead of basic logs
- **Role-based access** instead of root-only access
- **Email notifications** instead of silent failures

### Migration Steps

1. **Inventory existing servers** and add them to the application
2. **Test connectivity** using the monitoring features
3. **Configure groups** to match your current server organization
4. **Set up scheduling** to replace existing cron jobs
5. **Train users** on the new interface
6. **Gradually phase out** old scripts

---

**Assurnet Orchestration** - Transforming server management with modern technology and enterprise-grade reliability.