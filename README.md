# Nimbus Athletica (All-in Node.js)

## 目录结构

- `app.js`：后端主入口（Express）
- `server/`：后端业务代码（路由、中间件、工具）
- `pages/`：全部 HTML 页面
- `styles/`：CSS 样式目录（`main.css`）
- `scripts/`：前端原生 JS 逻辑
- `database/`：Prisma schema、migrations、SQLite 数据库
- `uploads/`：商品图片上传目录

## 一键初始化

```bash
npm run setup
```

## 一键启动

```bash
npm run dev
```

启动后访问：

- 网站主页：`http://localhost:4000`
- 管理后台：`http://localhost:4000/admin/login`
- 健康检查：`http://localhost:4000/health`

## 默认管理员账号

来自根目录 `.env`：

- `ADMIN_EMAIL=namekuok@gmail.com`
- `ADMIN_PASSWORD=admin123`

## 主要能力（保持与迁移前一致）

- 前台：分类导航、商品列表、详情页、颜色尺码选择、购物车、结算
- 用户：注册 / 登录 / 资料维护 / 我的订单
- 后台：管理员登录、分类增删、商品增改删、Variants 组合库存、订单汇总与状态更新
- 数据：SQLite + Prisma 迁移体系
