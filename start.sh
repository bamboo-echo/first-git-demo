#!/usr/bin/env bash
# 考点雷达 - 一键启动脚本 (macOS / Linux)
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "===================================================="
echo "  考点雷达 - 一键启动"
echo "  Kaodian Radar - One-Click Start"
echo "===================================================="
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 Node.js,请先安装 Node.js >= 18${NC}"
    echo "  下载地址: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}[✓]${NC} Node.js $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 npm${NC}"
    exit 1
fi
echo -e "${GREEN}[✓]${NC} npm $(npm --version)"
echo ""

# 1. 安装根工作区依赖
echo -e "${BLUE}[1/4]${NC} 安装根工作区依赖..."
npm install --no-audit --no-fund

# 2. 安装前端依赖
echo ""
echo -e "${BLUE}[2/4]${NC} 安装前端依赖..."
cd apps/web
if [ ! -d "node_modules" ]; then
    npm install --no-audit --no-fund
fi
cd ../..

# 3. 安装后端依赖 + 初始化数据库
echo ""
echo -e "${BLUE}[3/4]${NC} 安装后端依赖..."
cd apps/api
if [ ! -d "node_modules" ]; then
    npm install --no-audit --no-fund
fi

# 初始化 .env
if [ ! -f ".env" ]; then
    echo "  - 创建 .env 配置文件"
    cp .env.example .env
fi

# 初始化 Prisma
echo "  - 生成 Prisma Client"
npx prisma generate >/dev/null 2>&1

# 检查数据库是否存在
if [ ! -f "prisma/storage/dev.db" ]; then
    echo "  - 创建 SQLite 数据库"
    npx prisma migrate dev --name init --skip-seed >/dev/null 2>&1 || true
fi
cd ../..

# 4. 启动服务
echo ""
echo -e "${BLUE}[4/4]${NC} 启动服务..."
echo ""
echo "  后端: http://localhost:4000"
echo "  前端: http://localhost:5173"
echo "  健康: http://localhost:4000/api/health"
echo ""
echo "  按 Ctrl+C 可停止所有服务"
echo ""

# 启动后端(后台)
cd apps/api
nohup npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# 等待 3 秒
sleep 3

# 启动前端
cd apps/web
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待 5 秒
sleep 5

# 打开浏览器
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
fi

echo -e "${GREEN}[✓] 启动完成!${NC}"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:4000"
echo "  日志: backend.log / frontend.log"
echo ""
echo "停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 等待用户输入
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" INT TERM
wait
