# Sunlight City - Urban Comfort Analysis Platform

Sunlight City 是一个用于评估城市步行与骑行舒适度的前端演示平台。适合用于演示数据可视化、交互地图和实时指标展示。

## 🌟 功能特性

### 核心功能
- **交互式地图** - 可视化城市关键位置和舒适度数据
- **城市选择 / 账号菜单** - 顶部支持城市切换（默认 Manhattan）与账户菜单
- **实时数据面板（环境因素）** - 动态显示温度、湿度、风速、紫外线指数等环境因素（不含段级阴影覆盖）
- **舒适度分析** - 按时间段和月份分析行人和骑行路线的舒适度趋势
- **3D城市模型** - 支持三维模型展示（可扩展功能）
- **数据可视化** - 使用Recharts生成高级图表和趋势分析

### 研究对象
- **阴影覆盖分析** - 基于太阳轨迹的阴影动态计算
- **温度与湿度** - 实时环保数据监测
- **行人舒适度** - 综合多个因素的舒适度评分
- **骑行路线** - 针对自行车用户的专项评估

## 🛠 技术栈

- **前端**: Next.js 14 + React 18 (TypeScript)
- **样式**: Tailwind CSS
- **图表**: Recharts
- **图标**: Lucide React
- **可视化**: Three.js（支持）
- **地图**: Mapbox GL（集成就绪）

**后端（演示）**:
- **API 框架**: FastAPI (Python)
- **数据库**: PostgreSQL (asyncpg)
- **认证**: JWT (python-jose) + pbkdf2_sha256 (passlib)
- **异步 ORM**: SQLAlchemy 2.0+ (async)

> 本仓库附带一个轻量后端在 `/server`，用于本地演示用户注册、登录与会话（FastAPI + PostgreSQL）。详细设置和 API 文档见 `server/README.md`。

## 📦 安装与运行

### 前置要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000

### 生产构建
```bash
npm run build
npm start
```

### 部署到 Vercel（前端 + 后端一体）
项目已配置为在 Vercel 上同时运行 Next.js 与 FastAPI（`/api` 下的 Python 函数）。部署后需在 Vercel 项目设置中配置环境变量：

**必填：**
- `DATABASE_URL` — Supabase 连接串，格式：`postgresql+asyncpg://postgres:密码@db.xxx.supabase.co:5432/postgres?ssl=require`
- `SECRET_KEY` — JWT 签名用密钥（生产环境请用强随机串）
- `ALLOWED_ORIGINS` — 允许的 CORS 来源，多个用逗号分隔，例如：`https://你的项目.vercel.app,https://sunlight-city-blush.vercel.app`
- `NEXT_PUBLIC_API_BASE` — 前端请求后端的地址，部署后填：`https://你的项目.vercel.app/api`（与当前站点同域即可）

配置完成后重新部署，登录/注册会走 Vercel 上的 FastAPI，并连接 Supabase。

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── components/
│   ├── Dashboard.tsx       # 主仪表板
│   ├── Header.tsx          # 页面头部
│   ├── Sidebar.tsx         # 左侧导航栏
│   ├── MapView.tsx         # 交互式地图
│   ├── DataPanel.tsx       # 数据分析面板
│   └── RealTimeData.tsx    # 实时数据显示
└── lib/                    # 工具函数库
```

## 🎨 界面特点

- **现代深色主题** - 专为长时间使用优化的深色界面
- **响应式设计** - 支持各种屏幕尺寸
- **梯度渐变** - 视觉层级清晰的UI设计
- **实时动画** - 流畅的交互和过渡效果
- **信息密度优化** - 高效显示复杂数据

## 🗺 主要页面

### 地图视图
- 交互式城市地图
- 位置标记和舒适度指示
- 快速查看关键地点

### 分析视图
- 每日舒适度曲线
- 全年趋势分析
- 关键指标卡片
- 位置详细信息

### 3D模型视图
- 城市三维建筑模型
- 阴影投影可视化
- 多时间段对比

## 📊 数据指标

- **温度** - 实时温度数据（°C）
- **湿度** - 相对湿度百分比（%）
- **风速** - 风速数据（m/s）
- **紫外线指数** - UV Index（0-11）
- **舒适度指数** - 综合评分（0-100%）
- **阴影覆盖** - 日照阴影覆盖率（%）

## 🚀 扩展计划

- [ ] 实时天气API集成
- [ ] Mapbox实际地图集成
- [ ] Three.js 3D模型实现
- [ ] 数据库和后端API
- [ ] 用户认证系统
- [ ] 数据导出功能
- [ ] 移动应用支持

## 📝 开发指南

### 添加新组件
1. 在 `src/components/` 中创建新的 `.tsx` 文件
2. 使用 `'use client'` 指令用于客户端组件
3. 导入并在Dashboard中使用

### 修改样式
- 编辑 `tailwind.conig.ts` 自定义主题颜色
- 使用Tailwind CSS类进行样式设置
- 全局样式在 `src/app/globals.css`

### 集成真实数据
1. 创建 `src/lib/api.ts` 处理API调用
2. 使用 `useEffect` 在组件中获取数据
3. 更新状态管理逻辑