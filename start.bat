@echo off
chcp 65001 >nul
setlocal

echo.
echo ====================================================
echo   考点雷达 - 一键启动
echo   Kaodian Radar - One-Click Start
echo ====================================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js,请先安装 Node.js ^>= 18
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo [✓] Node.js %NODE_VERSION%

where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [✓] npm %NPM_VERSION%
echo.

REM 1. 安装根工作区依赖(concurrently)
echo [1/4] 安装根工作区依赖...
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo [错误] 根工作区依赖安装失败
    pause
    exit /b 1
)

REM 2. 安装前端依赖
echo.
echo [2/4] 安装前端依赖...
cd apps\web
if not exist node_modules (
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
)
cd ..\..

REM 3. 安装后端依赖 + 初始化数据库
echo.
echo [3/4] 安装后端依赖...
cd apps\api
if not exist node_modules (
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [错误] 后端依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
)

REM 初始化 .env
if not exist .env (
    echo   - 创建 .env 配置文件
    copy .env.example .env >nul
)

REM 初始化 Prisma
echo   - 生成 Prisma Client
call npx prisma generate >nul 2>&1

REM 检查数据库是否存在
if not exist prisma\storage\dev.db (
    echo   - 创建 SQLite 数据库
    call npx prisma migrate dev --name init --skip-seed >nul 2>&1
    if errorlevel 1 (
        echo   - 警告:数据库创建可能有问题,继续尝试启动
    )
)
cd ..\..

REM 4. 启动前后端
echo.
echo [4/4] 启动服务...
echo.
echo   后端: http://localhost:4000
echo   前端: http://localhost:5173
echo   健康: http://localhost:4000/api/health
echo.
echo   按 Ctrl+C 可停止所有服务
echo.

REM 启动后端(后台)
start "考点雷达-后端" /min cmd /c "cd apps\api && npm run start:dev"

REM 等待 3 秒
timeout /t 3 /nobreak >nul

REM 启动前端
start "考点雷达-前端" /min cmd /c "cd apps\web && npm run dev"

REM 等待 5 秒
timeout /t 5 /nobreak >nul

REM 打开浏览器
echo 正在打开浏览器...
start "" http://localhost:5173

echo.
echo [✓] 启动完成!
echo     前端:http://localhost:5173
echo     后端:http://localhost:4000
echo.
echo 关闭对应窗口或按任意键退出启动器(后端/前端仍在运行)
pause >nul
