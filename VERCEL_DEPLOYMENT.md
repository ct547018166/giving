# 感恩节活动 - Vercel 部署指南

## 部署步骤

### 1. 准备工作

确保你有以下准备：
- Vercel 账户 ([vercel.com](https://vercel.com))
- GitHub 账户 (用于代码托管)

### 2. 数据库配置

由于 Vercel 的 serverless 环境不支持文件系统持久化，你需要选择以下数据库解决方案之一：

#### 选项1: Vercel Postgres (推荐)

1. 在 Vercel 控制台中创建 Postgres 数据库
2. 复制数据库连接字符串
3. 在 Vercel 项目设置中添加环境变量：
   ```
   DATABASE_URL=your_postgres_connection_string
   ```

#### 选项2: 使用内存数据库 (仅用于演示)

如果不设置 `DATABASE_URL` 环境变量，应用将使用内存数据库。注意：数据不会持久化，重启后会丢失。

### 3. 部署到 Vercel

#### 方法1: 使用 Vercel CLI (推荐)

1. 安装 Vercel CLI：
   ```bash
   npm install -g vercel
   ```

2. 登录 Vercel：
   ```bash
   vercel login
   ```

3. 在项目根目录部署：
   ```bash
   vercel
   ```

4. 按照提示进行配置，选择默认选项即可

#### 方法2: 使用 Vercel 网页界面

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 连接你的 GitHub 仓库
4. 配置项目设置：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: next build
   - Output Directory: .next

### 4. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
# 数据库连接 (可选，如果使用Vercel Postgres)
DATABASE_URL=postgresql://...

# Vercel 环境标识 (自动设置)
VERCEL=1
```

### 5. 数据库迁移

部署后，你需要手动创建数据库表。可以通过以下方式：

1. 在 Vercel 函数日志中查看数据库初始化
2. 或者在本地测试数据库创建

### 6. 访问应用

部署完成后，你将获得一个 `.vercel.app` 域名的 URL，可以直接访问应用。

## 注意事项

- **数据持久化**: 如果使用内存数据库，数据不会保存
- **性能**: 首次访问可能较慢，因为需要初始化数据库
- **成本**: Vercel Postgres 有免费额度，超出后需要付费

## 故障排除

如果遇到问题：

1. 检查 Vercel 函数日志
2. 确认环境变量配置正确
3. 确认数据库连接字符串格式正确