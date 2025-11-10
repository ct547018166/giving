# 使用 Ubuntu 22.04 作为基础镜像（更稳定）
FROM ubuntu:22.04

# 避免交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 更新包列表并安装基础工具
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 安装系统依赖（better-sqlite3 需要）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 创建非root用户
RUN useradd -m -u 1001 -s /bin/bash nodejs

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["npm", "start"]