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
  const { key, title, content } = ctx.request.body;
  const isArticleExists = await db.isArticleExists(key);
  if (!isArticleExists) {
    const id = await db.createArticle(key, title, content);
    push.sendMessage({
      type: 'article',
      message: `新增文章：${title}`,
      id
    });
  }
  ctx.body = { status: true };
}).put('/articles/:id', async ctx => {
  const id = ctx.params.id;
  const { title, content } = ctx.request.body;
  await db.updateArticle(id, title, content);
  push.sendMessage({
    type: 'article',
    message: `更新文章：${title}`,
    id
  });
  ctx.body = { status: true };
}).delete('/articles/:id', async ctx => {
  const article = await db.getArticle(ctx.params.id);
  if (article) {
    await db.deleteArticle(article.id);
    push.sendMessage({
      type: 'article',
      message: `删除文章：${article.title}`
    });
  }
  ctx.body = { status: true };
});

router.get('/sw.js', async ctx => {
  await send(ctx, 'public/sw.js', { maxage: 0 });
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