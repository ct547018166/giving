#!/bin/bash

# 腾讯云自动部署脚本
# 使用方法: bash deploy.sh

echo "🚀 开始部署 Giving 应用到腾讯云..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 root 用户运行此脚本"
  exit 1
fi

# 更新系统
echo "📦 更新系统..."
apt update && apt upgrade -y

# 安装 Node.js
echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2 和其他工具
echo "📦 安装 PM2 和工具..."
npm config set registry https://registry.npmmirror.com/
npm install -g pm2
apt install -y nginx git ufw

# 配置防火墙
echo "🔥 配置防火墙..."
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable

# 创建应用目录
echo "📁 创建应用目录..."
mkdir -p /var/www/giving
cd /var/www/giving

# 这里需要手动上传代码文件，或者配置 git
echo "⚠️  请手动上传项目文件到 /var/www/giving 目录"
echo "   或者配置 git 仓库"
read -p "按回车键继续 (确保代码已上传)..."

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 构建应用
echo "🔨 构建应用..."
npm run build

# 创建 PM2 配置
echo "⚙️  配置 PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'giving-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/giving',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AUTH_SECRET: 'prZnHWvNDrlE6mwKDxnujAN6yit+loYZKj/8JIdAGoE=',
      NEXTAUTH_URL: 'https://peacechurch.cn'
    }
  }]
}
EOF

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 配置 Nginx
echo "🌐 配置 Nginx..."
cat > /etc/nginx/sites-available/giving << EOF
server {
    listen 80;
    server_name peacechurch.cn www.peacechurch.cn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态文件缓存优化
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片和媒体文件缓存
    location ~* \.(jpg|jpeg|png|gif|svg|mp3|mp4|webp|avif)\$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用 Nginx 配置
ln -sf /etc/nginx/sites-available/giving /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
nginx -t && systemctl restart nginx

echo "✅ 部署完成！"
echo ""
echo "📋 接下来需要做的："
echo "1. 在腾讯云控制台配置域名解析 (A记录指向服务器IP)"
echo "2. 可选：配置 SSL 证书 (sudo certbot --nginx -d peacechurch.cn)"
echo "3. 测试网站访问：http://peacechurch.cn"
echo ""
echo "🔍 查看状态："
echo "  PM2: pm2 status"
echo "  Nginx: systemctl status nginx"
echo "  日志: pm2 logs giving-app"