import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRouter from './server/routes/auth.js';
import categoriesRouter from './server/routes/categories.js';
import productsRouter from './server/routes/products.js';
import ordersRouter from './server/routes/orders.js';
import messagesRouter from './server/routes/messages.js';
import customersRouter from './server/routes/customers.js';
import taxRouter from './server/routes/tax.js';
import { startEtransferMonitor } from './server/lib/etransfer-runner.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const rootDir = process.cwd();
const pagesDir = path.join(rootDir, 'pages');

const defaultOrigins = ['http://localhost:4000', 'http://127.0.0.1:4000'];
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(morgan('dev'));
app.use((_req, res, next) => {
  res.setHeader('x-app-server', 'clothottawa-express');
  next();
});
app.use('/api/orders/square/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/styles', express.static(path.join(rootDir, 'styles')));
app.use('/scripts', express.static(path.join(rootDir, 'scripts')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/tax', taxRouter);

function servePage(fileName) {
  return (_req, res) => {
    res.sendFile(path.join(pagesDir, fileName));
  };
}

app.get('/', servePage('index.html'));
app.get('/shop', servePage('shop.html'));
app.get('/category/:slug', servePage('category.html'));
app.get('/product/:id', servePage('product.html'));
app.get('/cart', servePage('cart.html'));
app.get('/checkout', servePage('checkout.html'));
app.get('/account', servePage('account.html'));
app.get('/orders', servePage('orders.html'));
app.get('/account/login', servePage('account-login.html'));
app.get('/account/register', servePage('account-register.html'));
app.get('/account/forgot-password', servePage('account-forgot-password.html'));
app.get('/account/verify-email', servePage('account-verify-email.html'));
app.get('/contact', servePage('contact.html'));
app.get('/admin', servePage('admin.html'));
app.get('/admin/login', servePage('admin-login.html'));
app.get('/admin/messages', servePage('admin-messages.html'));
app.get('/admin/users', servePage('admin-users.html'));
app.get('/admin/blocked-users', servePage('admin-blocked-users.html'));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(pagesDir, '404.html'));
});

app.use((error, _req, res, _next) => {
  if (
    error?.code === 'LIMIT_FILE_SIZE' ||
    error?.type === 'entity.too.large' ||
    error?.status === 413 ||
    error?.statusCode === 413
  ) {
    res.status(413).json({
      message:
        '上传内容太大。请压缩单张图片后再试，或拆分后分批上传。当前服务器支持单个文件最高 25MB。'
    });
    return;
  }

  console.error(error);
  const status = Number(error?.status || error?.statusCode || 500);
  res.status(status).json({ message: error?.message || 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`Node app running: http://localhost:${port}`);
  startEtransferMonitor();
});
