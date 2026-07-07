# 考点雷达公网部署准备记录

## 当前状态

- 前端生产构建已通过，产物目录：`apps/web/dist`。
- 后端 Nest 构建已通过，入口：`apps/api/dist/main.js`。
- Prisma Client 已生成，生产迁移文件已准备。
- Vercel / Render 部署配置已补齐。
- 当前本地 Git 仓库尚未配置远程仓库；真正公网部署仍需要 GitHub/Vercel/Render/Supabase 授权和项目创建。

## 已新增部署配置

| 文件 | 用途 |
|---|---|
| `render.yaml` | Render Blueprint 后端部署配置 |
| `vercel.json` | 从仓库根目录部署前端时使用 |
| `apps/web/vercel.json` | 从 `apps/web` 作为 Root Directory 部署时使用 |
| `apps/web/.env.production.example` | 前端生产环境变量模板 |
| `apps/api/.env.example` | 后端环境变量模板，已补 OAuth 与 APP_ORIGIN |

## 推荐部署顺序

1. 创建 Supabase / Neon PostgreSQL 数据库，复制 `DATABASE_URL`。
2. 把当前项目推送到 GitHub。
3. 在 Render 创建后端服务或导入 `render.yaml`。
4. 在 Vercel 创建前端项目，Root Directory 推荐设为 `apps/web`。
5. 配置 Vercel 环境变量 `VITE_API_BASE=https://你的后端域名`。
6. 回到 Render，把 `CORS_ORIGIN` 改成 Vercel 前端域名。
7. 打开前端域名，走查注册、登录、课程创建、资料添加、分析、计划、执行、历史。

## Render 后端配置

- Root Directory：`apps/api`
- Build Command：`npm install && npx prisma generate && npm run build`
- Start Command：`npx prisma migrate deploy && node dist/main.js`

### 必填环境变量

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=请填写至少32位随机字符串
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://你的前端域名
APP_ORIGIN=https://你的前端域名
AI_PROVIDER=local
```

### 可选第三方登录变量

```bash
WECHAT_OAUTH_CLIENT_ID=
WECHAT_OAUTH_REDIRECT_URI=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_REDIRECT_URI=
APPLE_OAUTH_CLIENT_ID=
APPLE_OAUTH_REDIRECT_URI=
```

## Vercel 前端配置

- Root Directory：`apps/web`
- Framework Preset：`Vite`
- Build Command：`npm run build`
- Output Directory：`dist`

### 必填环境变量

```bash
VITE_API_BASE=https://你的后端域名
VITE_APP_NAME=考点雷达
```

## 当前阻塞项

- 缺 GitHub 远程仓库地址。
- 缺 Supabase / Neon 的生产 `DATABASE_URL`。
- 缺 Render 后端公网域名。
- 缺 Vercel 前端公网域名。

拿到这些后，就可以完成最后的公网发布和作品帖体验入口更新。
