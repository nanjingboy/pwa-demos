const Koa = require('koa');
const Router = require('koa-router');
const json = require('koa-json');
const send = require('koa-send');
const serve = require('koa-static');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const db = require('./db');
const push = require('./push');

const app = new Koa();
const router = new Router();

router.post('/subscribe', async ctx => {
  const { endpoint, keys: { auth, p256dh } } = ctx.request.body;
  await db.createPushSubscription(endpoint, auth, p256dh);
  push.sendMessageWithSubscription(
    { type: 'subscribe', message: '感谢订阅^_^' },
    { endpoint, keys: { auth, p256dh } }
  );
  ctx.body = { status: true };
}).delete('/subscribe', async ctx => {
  const { endpoint, keys: { auth, p256dh } } = ctx.request.body;
  await db.deletePushSubscription(endpoint, auth, p256dh);
  ctx.body = { status: true };
});

router.get('/articles', async ctx => {
  ctx.body = await db.getArticles();
}).get('/articles/:id', async ctx => {
  ctx.body = await db.getArticle(ctx.params.id);
}).post('/articles', async ctx => {
  const { title, content } = ctx.request.body;
  const id = await db.createArticle(title, content);
  push.sendMessage({
    type: 'article',
    method: 'create',
    content: `新增文章：${title}`,
    id
  });
  ctx.body = { status: true };
}).put('/articles/:id', async ctx => {
  const { title, content } = ctx.request.body;
  await db.updateArticle(ctx.params.id, title, content);
  push.sendMessage({
    type: 'article',
    method: 'update',
    content: `更新文章：${title}`,
    id
  });
  ctx.body = { status: true };
}).delete('/articles/:id', async ctx => {
  await db.deleteArticle(ctx.params.id);
  push.sendMessage({
    type: 'article',
    method: 'delete',
    content: `删除文章：${title}`
  });
  ctx.body = { status: true };
});

router.get('/create', async ctx => {
  await send(ctx, 'public/edit.html');
});

router.get('/detail/:id', async ctx => {
  const id = ctx.params.id;
  if (/^\d+$/.test(id)) {
    await send(ctx, 'public/detail.html');
  } else {
    await send(ctx, `public/${id}`);
  }
});

router.get('/edit/:id', async ctx => {
  const id = ctx.params.id;
  if (/^\d+$/.test(id)) {
    await send(ctx, 'public/edit.html');
  } else {
    await send(ctx, `public/${id}`);
  }
});

app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(serve('public'));
app.use(router.routes());

Promise.all([
  db.setup(),
  push.setup()
]).then(() => {
  app.listen(8086, () => {
    console.log('\nExample app running on http://127.0.0.1:8086\n');
  });
});