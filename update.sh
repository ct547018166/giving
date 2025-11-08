#!/bin/bash

# 🚀 便捷更新脚本 - 一键更新腾讯云上的感恩节活动网站
# 使用方法: ./update.sh

set -e  # 遇到错误立即退出

echo "🚀 开始更新感恩节活动网站..."
echo "==============================="

# 配置信息（请根据实际情况修改）
SERVER_IP="203.195.208.202"
SERVER_USER="root"
PROJECT_DIR="/Users/chentong/Documents/giving"
REMOTE_DIR="/root"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    log_error "请在项目根目录运行此脚本"
    log_info "当前目录: $(pwd)"
    exit 1
fi

log_step "1/4 - 打包项目文件"
cd "$PROJECT_DIR"
log_info "创建更新包..."
tar -czf ../giving-update.tar.gz --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='giving-update.tar.gz' .

if [ ! -f "../giving-update.tar.gz" ]; then
    log_error "打包失败！"
    exit 1
fi

log_info "✅ 打包完成: $(ls -lh ../giving-update.tar.gz | awk '{print $5}')"

log_step "2/4 - 上传到腾讯云服务器"
log_info "上传文件到 $SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
scp ../giving-update.tar.gz $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

if [ $? -ne 0 ]; then
    log_error "上传失败！请检查网络连接和服务器状态"
    exit 1
fi

log_info "✅ 上传完成"

log_step "3/4 - 远程部署更新"
log_info "连接到服务器并执行更新..."

# 使用 SSH 执行远程命令
ssh $SERVER_USER@$SERVER_IP << 'REMOTE_COMMANDS'
    set -e

    echo "📦 解压更新文件..."
    cd /root
    tar -xzf giving-update.tar.gz -C giving/ --overwrite

    cd giving

    echo "🐳 停止旧服务..."
    docker-compose down 2>/dev/null || true

    echo "🔨 重新构建和启动..."
    docker-compose up -d --build --force-recreate

    echo "⏳ 等待服务启动..."
    sleep 30

    echo "🏥 健康检查..."
    if curl -f --max-time 10 http://localhost/api/health &>/dev/null; then
        echo "✅ 应用健康检查通过"
    else
        echo "⚠️ 应用健康检查失败，但服务可能仍在启动中"
    fi

    if curl -f --max-time 5 http://localhost &>/dev/null; then
        echo "✅ Nginx 代理正常"
    else
        echo "⚠️ Nginx 代理可能有问题"
    fi

    echo "📊 服务状态:"
    docker-compose ps

    echo "🎉 服务器端更新完成！"
REMOTE_COMMANDS

if [ $? -ne 0 ]; then
    log_error "远程部署失败！"
    exit 1
fi

log_step "4/4 - 验证更新结果"
log_info "验证网站访问..."

# 等待额外时间确保服务完全启动
sleep 10

# 测试网站访问
if curl -f --max-time 10 http://$SERVER_IP &>/dev/null; then
    log_info "✅ 网站访问正常: http://$SERVER_IP"
else
    log_warn "⚠️ 网站访问可能有问题，请手动检查"
fi

# 清理本地临时文件
log_info "清理临时文件..."
rm -f ../giving-update.tar.gz

echo ""
echo "🎉 更新完成！"
echo "=============="
echo ""
echo "🌐 访问地址："
echo "  公网访问: http://$SERVER_IP"
echo "  域名访问: http://peacechurch.cn (如果已配置DNS)"
echo ""
echo "🛠️ 管理命令："
echo "  SSH连接: ssh $SERVER_USER@$SERVER_IP"
echo "  查看状态: cd /opt/giving && ./manage.sh status"
echo "  查看日志: cd /opt/giving && ./manage.sh logs"
echo ""
echo "📝 下次更新只需运行: ./update.sh"
echo ""
echo "✅ 网站更新成功！感恩节活动网站已更新到最新版本！🎊"