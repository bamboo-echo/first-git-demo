# 考点雷达 · 智能复习规划系统

> 面向大学生期末备考场景的 AI 复习分析工具 —— 上传课程资料,系统自动识别题型结构、知识点分布和高频考点,并根据剩余备考时间生成「极速版 / 标准版 / 补充版」三种复习方案。

**TRAE AI 创造力大赛参赛作品**

---

## 一、产品介绍

### 1.1 一句话介绍

**考点雷达 = 课程资料管理 + 题型考点雷达分析 + 智能复习路线生成**。

### 1.2 核心用户

- 大学生、期末周备考学生
- 资料很多但时间很少的学生
- 不知道重点、不知道怎么安排复习顺序的学生
- 缺少学长学姐资料整理经验的学生

### 1.3 解决的核心问题

期末周的大学生通常面临:
- 资料太多,不知道先看什么
- 真题很多,不知道哪些知识点高频
- 时间紧张,不知道哪些可以先跳过
- 没有复习路线,只能眉毛胡子一把抓

**考点雷达** 把这些杂乱资料 → 自动分析 → 变成一份**可执行的复习路线图**。

### 1.4 主要功能

| 模块 | 功能 | 价值 |
|------|------|------|
| **课程管理** | 多门课程、目标管理、考试时间、复习时长 | 统一管理所有期末课程 |
| **资料中心** | 真题/PPT/教材目录/讲义/笔记/习题六类 | 资料结构化,便于分析 |
| **智能分析** | 题型结构、考点权重、准备度评分、补充清单 | 一眼看清复习全貌 |
| **复习计划** | 极速版(时间紧)/标准版(时间充裕)/补充版(补漏洞) | 按时间选最合适的路线 |
| **任务执行** | 复习任务列表、勾选完成、补充待办 | 行动闭环,从分析到执行 |
| **历史归档** | 考完归档、回顾每次备考 | 数据沉淀,长期使用 |
| **多用户系统** | 注册/登录/JWT 认证/数据隔离 | 支持多个用户独立使用 |

---

## 二、技术架构

### 2.1 整体架构

```
考点雷达 (Monorepo)
├── apps/
│   ├── web/      # React + Vite + TypeScript 前端
│   └── api/      # NestJS + Prisma + SQLite 后端
└── packages/
    └── shared/   # 共享类型定义
```

### 2.2 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + Vite 8 + TypeScript 6 + 原生 CSS (设计系统 v6/v7) |
| **后端** | NestJS 10 + Prisma 5 + JWT + Passport + bcryptjs |
| **数据库** | SQLite (本地一键运行) / PostgreSQL (生产可选) |
| **AI 引擎** | 本地规则引擎(默认) + DeepSeek/OpenAI(可选) |
| **认证** | JWT Token + bcryptjs 密码加密 |
| **Monorepo** | npm workspaces + concurrently |
| **部署** | Vercel(前端) + Render/Railway(后端) + Supabase/Neon(数据库) |

### 2.3 后端模块

| 模块 | 路由 | 职责 |
|------|------|------|
| `AuthModule` | `/api/auth/*` | 注册、登录、获取当前用户 |
| `CoursesModule` | `/api/courses/*` | 课程 CRUD |
| `MaterialsModule` | `/api/courses/:id/materials/*` | 资料 CRUD |
| `TasksModule` | `/api/courses/:id/tasks/*` | 复习任务 CRUD |
| `AnalysisModule` | `/api/courses/:id/analysis/*` | 智能分析 |
| `PlanModule` | `/api/courses/:id/plans/*` | 复习计划生成 |
| `AiModule` | (内部) | 混合 AI 服务(本地/DeepSeek/OpenAI) |
| `PrismaModule` | (全局) | 数据库连接 |
| `HealthController` | `/api/health` | 健康检查 |

### 2.4 数据模型

7 张核心表:`User` / `Course` / `Material` / `Task` / `Analysis` / `Plan` / `HistoryRecord`

完整定义见 [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

---

## 三、一键运行

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 方式 A:脚本一键启动(推荐)

#### Windows

```bat
# 在项目根目录双击运行
start.bat
```

#### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

脚本会自动:
1. 安装所有依赖(根 + apps/web + apps/api)
2. 初始化数据库(prisma generate + migrate)
3. 启动后端服务(http://localhost:4000)
4. 启动前端服务(http://localhost:5173)
5. 浏览器自动打开主页

### 方式 B:手动启动

```bash
# 1. 安装所有依赖(根工作区 + 前后端)
npm run install:all

# 2. 初始化数据库
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
cd ../..

# 3. 同时启动前后端
npm run dev
```

启动后:
- 前端:http://localhost:5173
- 后端:http://localhost:4000
- 健康检查:http://localhost:4000/api/health

### 方式 C:分别启动

```bash
# 终端 1:启动后端
cd apps/api
npm run start:dev

# 终端 2:启动前端
cd apps/web
npm run dev
```

---

## 四、使用说明

### 4.1 第一次使用

1. 打开 http://localhost:5173
2. 点击「注册」,填写邮箱/用户名/密码(任意邮箱,例如 `demo@test.com`)
3. 登录后,点击「+ 新建课程」,输入课程名称
4. 系统自动创建示例资料,进入「智能分析」页面点击「重新分析」

### 4.2 核心操作流程

```
注册/登录
  ↓
新建课程 (输入课程名、考试时间、复习时长)
  ↓
资料管理 (上传/添加 真题/PPT/目录/讲义)
  ↓
智能分析 (题型结构 + 高频考点 + 准备度评分 + 补充清单)
  ↓
复习计划 (极速版 / 标准版 / 补充版)
  ↓
任务执行 (勾选完成复习任务)
  ↓
历史归档 (考完归入历史)
```

### 4.3 体验要点

- 资料越完整,分析越精准(尤其是真题和教材目录)
- 复习时长不同,会得到不同的复习计划推荐
- 切换「极速版 / 标准版 / 补充版」可看到不同时间预算下的复习策略
- 多次点击「重新分析」会基于最新资料重新生成所有内容

---

## 五、API 文档

### 5.1 认证

```bash
# 注册
POST /api/auth/register
{
  "email": "demo@test.com",
  "username": "demo",
  "password": "demo123"
}

# 登录
POST /api/auth/login
{
  "email": "demo@test.com",
  "password": "demo123"
}

# 获取当前用户(需 Authorization: Bearer <token>)
GET /api/auth/me
```

### 5.2 课程 / 资料 / 任务 / 分析 / 计划

所有受保护接口均需要 `Authorization: Bearer <token>` 头。

完整接口列表参见 [apps/api/src/app.module.ts](apps/api/src/app.module.ts) 中的路由注册。

---

## 六、构建生产版本

```bash
# 在根目录一键构建前后端
npm run build
```

产物:
- 前端:`apps/web/dist/`(静态文件,可直接部署到 Vercel/Netlify/任意静态托管)
- 后端:`apps/api/dist/`(Node.js,需用 `node dist/main.js` 启动)

---

## 七、部署到公网(评委可访问)

详细部署指南见 [DEPLOY.md](DEPLOY.md)。

**推荐方案**:
1. **前端**:Vercel(免费、自动 HTTPS、自动部署)
2. **后端**:Render / Railway(免费层,支持 Node.js)
3. **数据库**:Supabase / Neon(免费层 PostgreSQL)

整个部署过程约 15 分钟,无需信用卡。

---

## 八、项目结构

```
oss/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 数据模型
│   │   │   └── migrations/     # 数据库迁移
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── health.controller.ts
│   │   │   └── modules/
│   │   │       ├── auth/       # 注册/登录
│   │   │       ├── courses/    # 课程管理
│   │   │       ├── materials/  # 资料管理
│   │   │       ├── tasks/      # 任务管理
│   │   │       ├── analysis/   # 智能分析 + 本地引擎
│   │   │       ├── plan/       # 复习计划
│   │   │       ├── ai/         # AI 服务(本地/DeepSeek/OpenAI)
│   │   │       └── prisma/     # Prisma 客户端
│   │   ├── .env                # 环境变量(已 gitignore)
│   │   └── package.json
│   └── web/                    # React 前端
│       ├── src/
│       │   ├── App.tsx         # 主应用 + Auth 集成
│       │   ├── App.css         # 设计系统 v6 + v7
│       │   ├── components/
│       │   │   ├── AuthView.tsx       # 登录/注册
│       │   │   ├── SidebarNav.tsx     # 侧边栏
│       │   │   ├── InspectorPanel.tsx # 检视面板
│       │   │   └── views/             # 6 个主视图
│       │   ├── contexts/AuthContext.tsx
│       │   ├── hooks/useCourseState.ts
│       │   ├── utils/api.ts    # API 客户端
│       │   └── types/          # 类型定义
│       └── package.json
├── packages/
│   └── shared/                 # 共享类型
│       ├── types.ts
│       └── package.json
├── package.json                # 根工作区 + npm scripts
├── start.bat                   # Windows 一键启动
├── start.sh                    # macOS/Linux 一键启动
├── README.md
├── DEPLOY.md                   # 部署指南
└── .gitignore
```

---

## 九、TRAE 开发过程

本项目由 **TRAE IDE** 完整开发,过程中使用了:

- **前后端一体化架构设计**:NestJS + React + Prisma 全栈方案
- **设计系统驱动 UI**:v6(纯黑克制美学) + v7(认证/TopBar/用户卡片)分层
- **本地规则引擎 + 可选 AI**:保证零成本、零配置即可使用,同时支持外部 AI
- **比赛全流程支持**:从报名、原型、初赛到答辩,文档、代码、UI、部署齐备

---

## 十、许可

仅供 TRAE AI 创造力大赛评审使用。

---

**⭐ 祝你期末稳过,考点尽在掌握!**
