import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 搞定800词 后端服务已启动 → http://localhost:${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}/api/health`);
  console.log(`📅 环境: ${process.env.NODE_ENV || 'development'}`);
});
