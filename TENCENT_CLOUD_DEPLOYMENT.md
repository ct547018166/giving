# 腾讯云部署指南

## 传统部署方式

### 1. 服务器准备
```bash
# 连接服务器
ssh root@你的服务器IP

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 (进程管理器)
sudo npm install -g pm2

# 安装 Nginx (反向代理)
sudo apt install nginx -y

# 安装 Git
sudo apt install git -y
```

### 2. 配置防火墙
```bash
# 开放 80, 443, 22 端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw --force enable
```

### 3. 部署应用

#### 上传代码到服务器
```bash
# 在服务器上克隆代码
git clone https://github.com/your-username/giving.git
cd giving

# 或者直接上传代码文件
# 使用 scp 或其他方式上传项目文件
```

#### 安装依赖并构建
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

#### 配置 PM2 启动应用
```bash
# 创建 PM2 配置文件
nano ecosystem.config.js
```

**ecosystem.config.js 内容：**
```javascript
module.exports = {
  apps: [{
    name: 'giving-app',
    script: 'npm',
    args: 'start',
    cwd: '/root/giving',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

```bash
# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置 Nginx

#### 创建 Nginx 配置
```bash
sudo nano /etc/nginx/sites-available/giving
```

**Nginx 配置内容：**
```nginx
server {
    listen 80;
    server_name peacechurch.cn www.peacechurch.cn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存优化
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片和媒体文件缓存
    location ~* \.(jpg|jpeg|png|gif|svg|mp3|mp4|webp|avif)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 启用配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/giving /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 域名配置

#### 在腾讯云控制台配置域名解析
1. 进入 [腾讯云域名控制台](https://console.cloud.tencent.com/domain)
2. 找到你的域名 peacechurch.cn
3. 添加 DNS 解析记录：

**记录类型：A**
- 主机记录：@
- 记录值：你的服务器公网IP

**记录类型：A**
- 主机记录：www
- 记录值：你的服务器公网IP

#### SSL 证书配置（可选但推荐）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取免费 SSL 证书
sudo certbot --nginx -d peacechurch.cn -d www.peacechurch.cn
```

### 6. 数据库配置

#### SQLite 数据库位置
确保数据库文件在项目目录中，并且有正确的权限：
```bash
# 确保数据库文件权限正确
chmod 644 /root/giving/gratitudes.db
```

### 7. 监控和维护

#### 查看应用状态
```bash
# PM2 状态
pm2 status

# 查看日志
pm2 logs giving-app

# 重启应用
pm2 restart giving-app
```

#### Nginx 日志
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 8. 备份策略

#### 定期备份数据库
```bash
# 创建备份脚本
nano /root/backup.sh
```

**backup.sh 内容：**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /root/giving/gratitudes.db /root/backup/gratitudes_$DATE.db

# 只保留最近7天的备份
find /root/backup -name "gratitudes_*.db" -mtime +7 -delete
```

```bash
# 设置定时备份
crontab -e
# 添加：0 2 * * * /root/backup.sh
```

### 9. 性能优化

#### 服务器层面优化
```bash
# 增加文件句柄限制
echo "fs.file-max = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 优化网络参数
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 应用层面优化
- 确保 Next.js 生产模式运行
- 配置适当的 PM2 集群模式（如果需要）
- 监控内存和 CPU 使用情况

### 10. 故障排除

#### 常见问题
1. **端口被占用**：检查 3000 端口是否被其他服务使用
2. **权限问题**：确保文件权限正确
3. **内存不足**：升级服务器配置或优化应用
4. **域名不生效**：等待 DNS 解析生效（可能需要几分钟到几小时）

#### 快速重启服务
```bash
# 重启应用
pm2 restart giving-app

# 重启 Nginx
sudo systemctl restart nginx
```
