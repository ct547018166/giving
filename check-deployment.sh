#!/bin/bash

# 腾讯云部署检查脚本
# 用于验证部署状态和配置

echo "🔍 检查腾讯云部署状态..."
echo "================================="

# 检查 Node.js
echo "📦 Node.js 版本:"
node --version
npm --version
echo ""

# 检查 PM2
echo "⚙️ PM2 状态:"
pm2 list
echo ""

# 检查应用进程
echo "🚀 应用进程详情:"
pm2 show giving-app
echo ""

# 检查 Nginx
echo "🌐 Nginx 状态:"
systemctl is-active nginx
echo ""

echo "📄 Nginx 配置测试:"
nginx -t
echo ""

# 检查端口占用
echo "🔌 端口占用情况:"
netstat -tlnp | grep -E ':(80|443|3000)'
echo ""

# 检查防火墙
echo "🔥 防火墙状态:"
ufw status
echo ""

# 检查磁盘使用
echo "💾 磁盘使用情况:"
df -h /var/www
echo ""

# 检查应用日志
echo "📝 最近的应用日志:"
pm2 logs giving-app --lines 10 --nostream
echo ""

# 检查域名解析 (需要 curl)
if command -v curl &> /dev/null; then
    echo "🌍 域名解析检查:"
    echo "本地 IP: $(curl -s ifconfig.me)"
    echo "域名解析: $(dig +short peacechurch.cn)"
    echo ""

    echo "🔗 网站访问测试:"
    curl -I http://localhost 2>/dev/null | head -1
    echo ""
fi

echo "✅ 检查完成！"
echo ""
echo "💡 常见问题排查："
echo "1. 如果 PM2 显示应用未运行：pm2 restart giving-app"
echo "2. 如果 Nginx 配置错误：sudo nginx -t && sudo systemctl restart nginx"
echo "3. 如果端口被占用：netstat -tlnp | grep 3000"
echo "4. 如果域名不生效：等待 DNS 解析生效 (5-30分钟)"