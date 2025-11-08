#!/bin/bash

# 🎯 CI/CD 环境初始化脚本
# 为腾讯云服务器配置 CI/CD 部署环境

set -e

echo "🚀 初始化 CI/CD 部署环境..."
echo "=============================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 root 用户运行此脚本"
  exit 1
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. 更新系统
log_info "更新系统..."
apt update && apt upgrade -y

# 2. 安装 Docker
if ! command -v docker &> /dev/null; then
    log_info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 3. 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_info "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 4. 创建项目目录
log_info "创建项目目录..."
PROJECT_DIR="/opt/giving"
mkdir -p $PROJECT_DIR/{data,backups,ssl,public/uploads}

# 5. 创建基础配置文件
log_info "创建基础配置文件..."

# docker-compose.yml
cat > $PROJECT_DIR/docker-compose.yml << 'EOF'
services:
  giving-app:
    image: ccr.ccs.tencentyun.com/giving-app/thanksgiving-giving:latest
    container_name: giving-app
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./public/uploads:/app/public/uploads
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: giving-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - giving-app
    restart: unless-stopped
EOF

# nginx.conf
cat > $PROJECT_DIR/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    upstream giving_app {
        server giving-app:3000;
    }

    server {
        listen 80;
        server_name _;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        location / {
            proxy_pass http://giving_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        location /_next/static/ {
            proxy_pass http://giving_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location ~* \.(jpg|jpeg|png|gif|svg|ico|webp|avif)$ {
            proxy_pass http://giving_app;
            expires 6M;
            add_header Cache-Control "public, immutable";
        }

        location ~* \.(mp3|mp4|wav|ogg)$ {
            proxy_pass http://giving_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Accept-Ranges bytes;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# 6. 配置防火墙
log_info "配置防火墙..."
ufw --force enable
ufw allow 80
ufw allow 443
ufw allow 22

# 7. 创建管理脚本
log_info "创建管理脚本..."
cat > $PROJECT_DIR/manage.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "启动服务..."
        docker-compose start
        ;;
    stop)
        echo "停止服务..."
        docker-compose stop
        ;;
    restart)
        echo "重启服务..."
        docker-compose restart
        ;;
    logs)
        echo "查看日志..."
        docker-compose logs -f --tail=100
        ;;
    update)
        echo "更新应用..."
        docker-compose pull
        docker-compose up -d --force-recreate
        ;;
    backup)
        echo "备份数据..."
        /opt/giving/backup.sh
        ;;
    status)
        echo "=== 服务状态 ==="
        docker-compose ps
        echo ""
        echo "=== 系统资源 ==="
        df -h /opt/giving
        echo ""
        echo "=== 容器资源使用 ==="
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        ;;
    health)
        echo "=== 健康检查 ==="
        if curl -f http://localhost/api/health &>/dev/null; then
            echo "✅ 应用健康"
        else
            echo "❌ 应用不健康"
        fi
        if curl -f http://localhost &>/dev/null; then
            echo "✅ Nginx 正常"
        else
            echo "❌ Nginx 异常"
        fi
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|logs|update|backup|status|health}"
        exit 1
        ;;
esac
EOF

chmod +x $PROJECT_DIR/manage.sh

# 8. 创建备份脚本
log_info "创建备份脚本..."
cat > $PROJECT_DIR/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/giving/backups"

mkdir -p $BACKUP_DIR

echo "开始备份数据库..."

if docker exec giving-app cp /app/data/gratitudes.db /tmp/gratitudes_$DATE.db 2>/dev/null; then
    docker cp giving-app:/tmp/gratitudes_$DATE.db $BACKUP_DIR/ 2>/dev/null
    echo "✅ 备份完成: $BACKUP_DIR/gratitudes_$DATE.db"
else
    echo "⚠️ 数据库文件不存在或容器未运行"
fi

find $BACKUP_DIR -name "gratitudes_*.db" -mtime +7 -delete 2>/dev/null || true

echo "备份任务完成"
EOF

chmod +x $PROJECT_DIR/backup.sh

# 9. 设置定时备份
log_info "设置定时备份..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/giving/backup.sh") | crontab -

# 10. 设置目录权限
log_info "设置目录权限..."
chown -R 1000:1000 $PROJECT_DIR/data 2>/dev/null || true

# 11. 验证配置
log_info "验证配置..."
if [ -f "$PROJECT_DIR/docker-compose.yml" ] && [ -f "$PROJECT_DIR/nginx.conf" ]; then
    log_info "✅ 配置文件创建成功"
else
    log_error "❌ 配置文件创建失败"
    exit 1
fi

echo ""
echo "🎉 CI/CD 环境初始化完成！"
echo "=============================="
echo ""
echo "📋 接下来的步骤："
echo "1. 将代码推送到 GitHub（会自动触发 CI/CD）"
echo "2. 或者手动运行首次部署："
echo "   cd /opt/giving"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""
echo "🛠️ 管理命令："
echo "  查看状态: /opt/giving/manage.sh status"
echo "  查看日志: /opt/giving/manage.sh logs"
echo "  健康检查: /opt/giving/manage.sh health"
echo ""
echo "📁 项目目录: /opt/giving"
echo "🌐 访问地址: http://203.195.208.202"
echo ""
echo "✅ 服务器已准备好进行 CI/CD 部署！"