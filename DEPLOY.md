# 部署到公网指南

> 目标:让评委通过一个公开 URL 就能直接体验"考点雷达",**不需要**他们本地安装或部署。

---

## 方案总览

| 模块 | 推荐服务 | 免费层 | 部署时间 | 难度 |
|------|----------|--------|----------|------|
| **前端**(静态站点) | [Vercel](https://vercel.com) | ✅ 无限 | 3 分钟 | ⭐ |
| **后端**(Node.js) | [Render](https://render.com) | ✅ 750h/月 | 5 分钟 | ⭐⭐ |
| **数据库**(PostgreSQL) | [Supabase](https://supabase.com) | ✅ 500MB | 3 分钟 | ⭐ |

**总耗时:约 15 分钟,无需信用卡。**

---

## 方式 1:一体化部署(推荐)

### 1.1 数据库部署(Supabase)

1. 访问 https://supabase.com 并注册
2. 创建新项目(选最近的区域,密码自行设置)
3. 等待项目启动完成(约 2 分钟)
4. 进入 **Settings → Database**,找到 **Connection string → URI**
5. 复制形如 `postgresql://postgres:xxxx@db.xxxx.supabase.co:5432/postgres` 的 URL
6. **保存此 URL**,下一步会用到

### 1.2 后端部署(Render)

#### 准备工作:推送代码到 GitHub

如果代码还没在 GitHub:

```bash
cd "c:\Users\slougo\Desktop\solo工具\oss"
git init
git add .
git commit -m "考点雷达 - 完整版"
git branch -M main
git remote add origin https://github.com/你的用户名/kaodian-radar.git
git push -u origin main
```

#### 在 Render 部署

1. 访问 https://render.com 并注册(用 GitHub 登录最快)
2. 点击 **New +** → **Web Service**
3. 选择你刚推的 GitHub 仓库
4. 填写配置:
   - **Name**: `kaodian-radar-api`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/main.js`
5. 添加环境变量:
   - `DATABASE_URL` = (刚才复制的 Supabase URL)
   - `JWT_SECRET` = (随便一个长字符串)
   - `CORS_ORIGIN` = `*` (或你的前端 URL)
   - `AI_PROVIDER` = `local`
   - `NODE_ENV` = `production`
6. 选择 **Free** 套餐
7. 点击 **Create Web Service**
8. 等待 5-10 分钟部署完成
9. 复制 Render 给你分配的 URL,例如 `https://kaodian-radar-api.onrender.com`

### 1.3 前端部署(Vercel)

1. 访问 https://vercel.com 并注册(用 GitHub 登录)
2. 点击 **Add New...** → **Project**
3. 导入刚才的 GitHub 仓库
4. 填写配置:
   - **Project Name**: `kaodian-radar`
   - **Root Directory**: `apps/web` (点击 Edit 改成这个)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量:
   - `VITE_API_BASE` = (刚才 Render 给的 URL,例如 `https://kaodian-radar-api.onrender.com`)
6. 点击 **Deploy**
7. 等待 1-2 分钟
8. 复制 Vercel 给你的 URL,例如 `https://kaodian-radar.vercel.app`

### 1.4 验证

1. 打开 Vercel 给的 URL
2. 注册一个新用户
3. 创建课程 → 添加资料 → 点击分析 → 应该一切正常
4. **把这个 Vercel URL 发给评委** ✅

---

## 方式 2:使用其他平台

| 前端可替换 | 后端可替换 | 数据库可替换 |
|------------|------------|--------------|
| Netlify | Railway | Neon |
| Cloudflare Pages | Fly.io | PlanetScale |
| GitHub Pages | Heroku | Railway Postgres |
| 阿里云/腾讯云 OSS | 阿里云函数计算 | 阿里云 RDS |

部署原理相同:
- **前端**:任何静态托管都行,关键是设置 `VITE_API_BASE` 环境变量
- **后端**:任何支持 Node.js 18+ 的平台都行,关键是设置 `DATABASE_URL` 指向生产数据库

---

## 环境变量清单

### 前端(`apps/web/.env`)

```bash
VITE_API_BASE=https://你的后端URL
```

### 后端(`apps/api/.env`)

```bash
# 服务
PORT=4000
NODE_ENV=production

# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=至少32位的随机字符串
JWT_EXPIRES_IN=7d

# CORS(多个用逗号分隔,或 * 允许所有)
CORS_ORIGIN=https://你的前端URL

# AI
AI_PROVIDER=local
# AI_API_KEY=sk-xxx  # 仅当用 DeepSeek/OpenAI 时需要
# AI_BASE_URL=https://api.deepseek.com/v1
```

---

## 数据库迁移

部署到生产时,**不能**用 `prisma migrate dev`,要用:

```bash
npx prisma migrate deploy
```

或在 Render 的 Start Command 里加上(已在上面配置中):
```bash
npx prisma migrate deploy && node dist/main.js
```

---

## 性能与限制

### 免费层限制

| 平台 | 限制 |
|------|------|
| **Vercel** | 100GB 带宽/月,无限制访问次数 |
| **Render** | 750 小时/月,无访问 15 分钟后休眠(下次访问需 30 秒唤醒) |
| **Supabase** | 500MB 数据库,2GB 流量 |

### 建议

- **演示用**:免费层完全够用
- **正式上线**:建议升级到付费层(每平台约 $7/月,共 $21/月)
- **休眠问题**:Render 休眠会导致首次访问慢 30 秒,可在 Vercel 设置定时 ping(或直接升级)

---

## 故障排查

### 1. 前端访问后端报 CORS 错误

**解决**:检查 Render 的 `CORS_ORIGIN` 是否设为前端 URL(注意是 https,不是 http)。

### 2. 后端启动报数据库连接错误

**解决**:
- 检查 `DATABASE_URL` 格式
- Supabase 项目是否已完全启动(约 2 分钟)
- Render 的环境变量是否设置正确

### 3. 前端部署后页面空白

**解决**:
- 检查 Vercel 的 `VITE_API_BASE` 是否正确
- 打开浏览器控制台查看错误
- Vercel 的 Root Directory 必须是 `apps/web`

### 4. Render 服务一直 Loading

**解决**:
- 查看 Render 日志(Logs 标签)
- 常见原因:`DATABASE_URL` 未设置或格式错误
- Render 免费层冷启动需要 30-50 秒

---

## 一键回滚

任何一步出错,都可以在 Vercel/Render 控制台回滚到上一个正常版本。

---

## 联系方式

部署过程中遇到问题:
- 查看 Vercel/Render/Supabase 官方文档
- 在比赛群提问
- 给我发消息

---

**祝你部署顺利,比赛拿奖!** 🏆
