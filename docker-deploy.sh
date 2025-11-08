#!/bin/bash

# Docker 腾讯云一键部署脚本
# 使用方法: bash docker-deploy.sh

echo "🐳 开始使用 Docker 部署 Giving 应用到腾讯云..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 root 用户运行此脚本"
  exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /opt/giving/{data,ssl}
cd /opt/giving

echo "⚠️  请将以下文件上传到 /opt/giving 目录："
echo "   - Dockerfile"
echo "   - docker-compose.yml"
echo "   - nginx.conf"
echo "   - 整个项目源码文件夹"
read -p "按回车键继续 (确保文件已上传)..."

# 构建和启动容器
echo "🏗️ 构建和启动 Docker 容器..."
docker-compose down 2>/dev/null
docker-compose build --no-cache
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 配置防火墙
echo "🔥 配置防火墙..."
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable

# 创建备份脚本
echo "💾 创建数据库备份脚本..."
cat > /opt/giving/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/giving/backups"

mkdir -p $BACKUP_DIR

# 备份数据库
docker exec giving-app cp /app/data/gratitudes.db /tmp/gratitudes_$DATE.db 2>/dev/null || true
docker cp giving-app:/tmp/gratitudes_$DATE.db $BACKUP_DIR/ 2>/dev/null || true

# 清理7天前的备份
find $BACKUP_DIR -name "gratitudes_*.db" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/gratitudes_$DATE.db"
EOF

chmod +x /opt/giving/backup.sh

# 设置定时备份
echo "⏰ 设置定时备份..."
crontab -l 2>/dev/null | grep -v "backup.sh" | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/giving/backup.sh") | crontab -

# 创建管理脚本
echo "🛠️ 创建管理脚本..."
cat > /opt/giving/manage.sh << 'EOF'
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
        docker-compose logs -f
        ;;
    update)
        echo "更新应用..."
        docker-compose pull
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    backup)
        echo "手动备份..."
        /opt/giving/backup.sh
        ;;
    status)
        echo "服务状态:"
        docker-compose ps
        echo ""
        echo "系统资源:"
        df -h /opt/giving
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|logs|update|backup|status}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/giving/manage.sh

echo "✅ Docker 部署完成！"
echo ""
echo "📋 管理命令："
echo "  启动服务: /opt/giving/manage.sh start"
echo "  停止服务: /opt/giving/manage.sh stop"
echo "  重启服务: /opt/giving/manage.sh restart"
echo "  查看日志: /opt/giving/manage.sh logs"
echo "  更新应用: /opt/giving/manage.sh update"
echo "  备份数据: /opt/giving/manage.sh backup"
echo "  查看状态: /opt/giving/manage.sh status"
echo ""
echo "🌐 访问地址："
echo "  http://$(curl -s ifconfig.me)"
echo "  http://peacechurch.cn (配置域名后)"
echo ""
echo "📁 重要目录："
echo "  项目目录: /opt/giving"
echo "  数据库: /opt/giving/data/gratitudes.db"
echo "  备份: /opt/giving/backups/"
echo "  日志: docker-compose logs"