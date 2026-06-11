#!/bin/bash
# ============================================================
# 搞定公考800词 · 一键部署脚本
# 在服务器上执行: bash deploy.sh
# ============================================================
set -e

echo "========================================"
echo " 搞定公考800词 · 服务器部署"
echo "========================================"

# 1. 生成 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
echo "✅ 已生成随机密钥"

# 2. 如果还没克隆仓库，先克隆
if [ ! -d "coze-800" ]; then
  echo "📥 克隆仓库..."
  git clone https://github.com/holinhesmkf1418-lang/coze-800.git coze-800
  cd coze-800/server
else
  echo "📥 仓库已存在，更新..."
  cd coze-800
  git pull origin main
  cd server
fi

# 3. 创建 .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://root:${DB_PASSWORD}@mysql:3306/gongkao_800_words"
DB_ROOT_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
WECHAT_APPID=wx_your_appid_here
WECHAT_SECRET=your_secret_here
IMPORT_MAX_FILE_SIZE=10485760
EOF
echo "✅ .env 已创建"

# 4. 启动 Docker
echo "🐳 启动 Docker 服务..."
docker compose down 2>/dev/null || true
docker compose up -d --build
echo "⏳ 等待服务启动 (15s)..."
sleep 15

# 5. 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker exec gk800-server npx prisma migrate deploy
echo "✅ 迁移完成"

# 6. 导入 800 词数据
if [ -f "../data/vocab/gaoding_800_words_ocr.csv" ]; then
  echo "📚 导入词库..."
  docker exec gk800-server sh -c "
    curl -X POST http://localhost:3000/api/import/upload \
      -F 'file=@/app/../data/vocab/gaoding_800_words_ocr.csv' || true
  " 2>/dev/null
  echo "✅ 词库导入完成（或需手动导入）"
fi

# 7. 验证
echo ""
echo "========================================"
echo " 🧪 验证部署..."
echo "========================================"
sleep 2
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "Health: $HEALTH"
echo ""
echo "========================================"
echo " ✅ 部署完成!"
echo "========================================"
echo ""
echo " 📝 下一步:"
echo "   1. 修改 .env 中的 WECHAT_APPID 和 WECHAT_SECRET"
echo "   2. 导入词库: curl -X POST http://localhost:3000/api/import/upload -F 'file=@gaoding_800_words_ocr.csv'"
echo "   3. 配置 Nginx 反向代理 + SSL 证书 (HTTPS)"
echo "   4. 小程序后台配置 request 合法域名"
echo ""
echo " 🔑 数据库密码: $DB_PASSWORD"
echo "    (已写入 .env)"
echo "========================================"
