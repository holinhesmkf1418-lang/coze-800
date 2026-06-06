# 搞定800词 · 部署方案

> 更新：2026-06-06 | 目标：MVP 阶段快速上线，成本可控

---

## 一、技术栈总览

| 层 | 选型 | 说明 |
|----|------|------|
| 运行时 | Node.js 20 LTS | 稳定长期支持 |
| 框架 | Express 4.x | 轻量、生态丰富 |
| 语言 | TypeScript 5.x | 类型安全 |
| ORM | Prisma 5.x | 数据库迁移 + 类型生成 |
| 数据库 | MySQL 8.0 | 关系型数据，结构清晰 |
| 部署 | Docker + 云服务器 | 可移植、易扩展 |

---

## 二、服务器选型

### MVP 推荐：轻量云服务器

| 方案 | 配置 | 月费估算 | 适用阶段 |
|------|------|----------|----------|
| **腾讯云轻量** | 2核2G / 50G SSD / 3Mbps | ¥50-70 | MVP ✅ |
| 阿里云 ECS | 2核4G / 40G SSD / 3Mbps | ¥80-120 | 成长期 |
| 腾讯云 CloudBase | Serverless 容器 | 按量付费 | 弹性伸缩 |

**推荐选择：腾讯云轻量应用服务器**
- 优势：与微信小程序同体系（腾讯云生态），微信登录接口网络延迟低
- 系统：Ubuntu 22.04 LTS 或 CentOS 7.9
- 地域：上海/广州（近微信服务器）

### 域名 & HTTPS

- 小程序要求 API 接口必须 HTTPS
- 推荐：腾讯云 DNS 解析 + 免费 SSL（Let's Encrypt / 腾讯云证书）

---

## 三、Docker 部署

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### docker-compose.yml（含 MySQL）

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: gk800-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: gongkao_800_words
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  app:
    build: .
    container_name: gk800-server
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    environment:
      DATABASE_URL: mysql://root:${DB_ROOT_PASSWORD}@mysql:3306/gongkao_800_words
      NODE_ENV: production

volumes:
  mysql_data:
```

### 部署步骤

```bash
# 1. 服务器上安装 Docker & Docker Compose
curl -fsSL https://get.docker.com | bash

# 2. 创建 .env 文件
echo "DB_ROOT_PASSWORD=<强密码>" > .env
echo "JWT_SECRET=<随机字符串>" >> .env
echo "WECHAT_APPID=<小程序AppID>" >> .env
echo "WECHAT_SECRET=<小程序Secret>" >> .env

# 3. 启动服务
docker-compose up -d

# 4. 运行数据库迁移
docker exec gk800-server npx prisma migrate deploy

# 5. 验证
curl http://localhost:3000/api/health
```

---

## 四、CI/CD 流程

### 推荐：GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        run: docker build -t gk800-server:${{ github.sha }} .

      - name: Push to registry (可选：腾讯云容器镜像服务)
        run: |
          # docker tag ... && docker push ...

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/gk800-server
            git pull origin main
            docker-compose down
            docker-compose up -d --build
            docker exec gk800-server npx prisma migrate deploy
```

### 简化版（MVP 可先用）

```bash
# 在服务器上配置 git pull + 重启即可
cd /opt/gk800-server && \
  git pull && \
  docker-compose up -d --build
```

---

## 五、环境变量清单

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 环境 | production |
| `DATABASE_URL` | MySQL 连接串 | mysql://root:xxx@localhost:3306/gk800 |
| `WECHAT_APPID` | 小程序 AppID | wx1234567890 |
| `WECHAT_SECRET` | 小程序 Secret | abc123... |
| `JWT_SECRET` | JWT 签名密钥 | 随机 32 位字符串 |
| `JWT_EXPIRES_IN` | Token 有效期 | 7d |
| `DB_ROOT_PASSWORD` | MySQL root 密码 | 仅 docker-compose 用 |

---

## 六、监控与运维

### 基础监控（MVP）

- **进程守护：** Docker `restart: always` 保证崩溃自动重启
- **日志：** `docker logs -f gk800-server`
- **健康检查：** 定时 curl `/api/health`，用 cron 或 UptimeRobot 监控

### 数据库备份

```bash
# 每日凌晨备份 MySQL，保留7天
0 3 * * * docker exec gk800-mysql mysqldump -uroot -p$PASS gongkao_800_words \
  | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz && \
  find /backup -mtime +7 -delete
```

### 后续优化方向

- **Nginx 反向代理** —— 加在 app 前，处理 HTTPS、限流
- **Redis 缓存** —— 热点数据（词汇列表）缓存，降低数据库压力
- **日志收集** —— 接入阿里云 SLS 或自建 ELK
- **APM 监控** —— 接入腾讯云 APM 或 Sentry

---

## 七、成本估算（MVP）

| 项目 | 月费 |
|------|------|
| 云服务器（2核2G） | ¥50-70 |
| MySQL（自建在服务器上） | ¥0 |
| 域名 | ¥5-10/月（¥60/年） |
| SSL 证书 | ¥0（Let's Encrypt） |
| **合计** | **¥55-80/月** |

> 用户量 < 1000 DAU 时单机完全够用。后续扩展可考虑：数据库独立 RDS、接入 CDN、弹性伸缩。
