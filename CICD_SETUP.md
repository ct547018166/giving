# 🚀 CI/CD 自动化部署指南

## 🎯 目标
实现代码推送自动触发部署的完整 CI/CD 流程

## 📋 部署流程

```
代码推送 → GitHub Actions → 构建镜像 → 推送到腾讯云 → 自动部署
    ↓            ↓            ↓            ↓            ↓
  Git 提交    自动触发      Docker 构建   镜像仓库     服务器更新
```

## 🔧 配置步骤

### 步骤1：创建腾讯云容器镜像服务

1. **访问腾讯云容器镜像服务**：https://console.cloud.tencent.com/tcr
2. **创建实例**：
   - 实例名称：`giving-app`
   - 地域：选择广州或北京
   - 实例规格：个人版（免费）
3. **创建命名空间**：
   - 命名空间：`giving-app`
4. **创建镜像仓库**：
   - 仓库名称：`thanksgiving-giving`
   - 描述：感恩节活动网站

### 步骤2：获取腾讯云访问凭据

1. **创建访问凭据**：
   - 进入容器镜像服务控制台
   - 点击"访问凭据"
   - 创建新的访问凭据
   - 记录用户名和密码

2. **查看实例地址**：
   - 实例地址格式：`ccr.ccs.tencentyun.com`

### 步骤3：配置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

1. **访问 GitHub Secrets 设置**：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"

2. **添加以下 Secrets**：

| Secret 名称 | 值 | 说明 |
|-------------|----|------|
| `TENCENT_CLOUD_USERNAME` | 腾讯云用户名 | 容器镜像服务用户名 |
| `TENCENT_CLOUD_PASSWORD` | 腾讯云密码 | 容器镜像服务密码 |
| `SERVER_HOST` | `203.195.208.202` | 服务器公网IP |
| `SERVER_USERNAME` | `root` | 服务器用户名 |
| `EYSERVER_SSH_K` | SSH私钥内容 | 用于SSH连接的私钥 |
| `SERVER_PORT` | `22` | SSH端口（可选） |

#### 🔐 生成 SSH 密钥对

```bash
# 在本地生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@github.com"

# 查看公钥（添加到服务器）
cat ~/.ssh/id_rsa.pub

# 查看私钥（添加到 GitHub Secrets）
cat ~/.ssh/id_rsa
```

#### 📝 添加 SSH 公钥到服务器

```bash
# 在腾讯云服务器上
echo "你的SSH公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤4：推送代码触发部署

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Add CI/CD pipeline for automated deployment"

# 推送到 GitHub（会自动触发部署）
git push origin main
```

## 📊 CI/CD 工作流详解

### 触发条件
- ✅ **推送** 到 `main` 分支
- ✅ **Pull Request** 到 `main` 分支

### 构建步骤
1. **代码检出** - 获取最新代码
2. **Docker 构建** - 构建应用镜像
3. **推送到腾讯云** - 上传镜像到容器服务
4. **自动部署** - SSH连接服务器更新服务

### 部署策略
- **滚动更新** - 停止旧服务，启动新服务
- **健康检查** - 确保新服务正常运行
- **自动回滚** - 健康检查失败时停止部署

## 🛠️ 本地测试

### 测试 Docker 构建
```bash
# 本地构建测试
docker build -t giving-app:test .

# 运行测试
docker run -p 3000:3000 giving-app:test
```

### 验证配置文件
```bash
# 检查 docker-compose.yml
docker-compose config

# 检查 GitHub Actions 工作流
# 访问: https://github.com/your-username/giving/actions
```

## 📈 监控和日志

### 查看部署状态
- **GitHub Actions**: https://github.com/your-username/giving/actions
- **腾讯云镜像**: https://console.cloud.tencent.com/tcr

### 服务器日志
```bash
# 查看应用日志
cd /opt/giving
./manage.sh logs

# 查看服务状态
./manage.sh status
```

## 🔍 故障排除

### 常见问题

#### 1. GitHub Actions 失败
```bash
# 检查 Secrets 配置
# 确保腾讯云凭据正确
# 检查 SSH 密钥格式
```

#### 2. Docker 构建失败
```bash
# 检查 Dockerfile 语法
# 验证本地构建: docker build .
```

#### 3. 部署失败
```bash
# 检查服务器 SSH 连接
# 验证 docker-compose.yml
# 查看服务器防火墙设置
```

#### 4. 健康检查失败
```bash
# 检查应用是否正常启动
# 验证数据库连接
# 查看应用日志
```

## 💰 费用说明

### 腾讯云费用
- **容器镜像服务**：个人版 免费
- **服务器**：¥60-100/月（已有）
- **GitHub Actions**：免费额度足够

### 免费额度
- GitHub Actions：每月 2000 分钟
- 腾讯云镜像存储：每月 10GB 免费（个人版）

## 🎯 优势总结

| 特性 | 手动部署 | CI/CD 自动化 |
|------|----------|-------------|
| **部署速度** | 3-5分钟 | 2-3分钟 |
| **人工干预** | 需要手动 | 全自动 |
| **错误率** | 中等 | 低 |
| **可重复性** | 差 | 优秀 |
| **维护成本** | 高 | 低 |

## 🚀 开始使用

1. **设置腾讯云容器服务**
2. **配置 GitHub Secrets**
3. **推送代码触发自动部署**

```bash
git add .
git commit -m "Enable CI/CD pipeline"
git push origin main
```

现在每次推送代码都会自动部署！🎉