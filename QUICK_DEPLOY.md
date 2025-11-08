# 腾讯云快速部署清单

## 🎯 目标
将 Giving 应用从 Vercel 迁移到腾讯云，提升中国大陆访问速度

## 📋 快速步骤

### 1. 购买服务器
- **产品**：轻量应用服务器
- **地区**：广州/上海/北京
- **配置**：2核4G，Ubuntu 22.04
- **费用**：约 ¥60-100/月

### 2. 服务器配置
```bash
# 连接服务器
ssh root@你的服务器IP

# 运行自动部署脚本
wget https://raw.githubusercontent.com/your-repo/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 3. 上传代码
```bash
# 在本地打包项目
tar -czf giving.tar.gz .

# 上传到服务器
scp giving.tar.gz root@服务器IP:/var/www/

# 服务器解压
cd /var/www
tar -xzf giving.tar.gz
```

### 4. 域名配置
在腾讯云域名控制台添加 A 记录：
- 主机记录：@ 和 www
- 记录值：服务器公网IP

### 5. SSL 证书（推荐）
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d peacechurch.cn -d www.peacechurch.cn
```

## 🔍 验证部署

### 检查服务状态
```bash
pm2 status          # 应用状态
systemctl status nginx  # Nginx 状态
```

### 测试访问
- http://peacechurch.cn
- https://peacechurch.cn (SSL后)

## 📊 性能对比

| 方面 | Vercel | 腾讯云 |
|------|--------|--------|
| 大陆访问速度 | 慢 (海外服务器) | 快 (国内服务器) |
| 费用 | 免费额度后收费 | ¥60-150/月 |
| 维护复杂度 | 简单 | 中等 |
| 自定义配置 | 有限 | 完全控制 |

## 🆘 故障排除

### 网站无法访问
1. 检查域名解析：`ping peacechurch.cn`
2. 检查 Nginx：`sudo nginx -t`
3. 检查应用：`pm2 logs giving-app`

### 应用无法启动
1. 检查端口占用：`netstat -tlnp | grep 3000`
2. 检查依赖：`npm install`
3. 重启应用：`pm2 restart giving-app`

## 💰 费用明细

- **服务器**：¥60-100/月 (2核4G)
- **带宽**：¥0.8/GB (超出免费额度)
- **域名**：已有 peacechurch.cn
- **SSL**：免费 (Let's Encrypt)

**总计**：约 ¥60-150/月

---

## 🚀 一键部署命令

如果你的代码在 GitHub 上，可以直接在服务器上运行：

```bash
# 安装依赖
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs npm nginx git ufw

# 配置防火墙
ufw allow 80 && ufw allow 443 && ufw allow 22 && ufw --force enable

# 克隆代码
git clone https://github.com/your-username/giving.git
cd giving

# 安装和启动
npm install
npm run build
npm install -g pm2
pm2 start npm --name "giving-app" -- start
pm2 startup && pm2 save

# 配置 Nginx (记得替换你的域名)
# ... Nginx 配置见详细指南
```

按照这个清单操作，你就能快速将网站部署到腾讯云了！