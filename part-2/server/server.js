const Koa = require('koa');
const Router = require('koa-router');
const json = require('koa-json');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const db = require('./db');
const push = require('./push');

const app = new Koa();
const router = new Router();

router.post('/subscribe', async ctx => {
  console.log('\nPOST /subscribe');
  const { endpoint, keys: { auth, p256dh } } = ctx.request.body;
  await db.createPushSubscription(endpoint, auth, p256dh);
  ctx.body = { status: true };
}).delete('/subscribe', async ctx => {
  console.log('\nDELETE /subscribe');
  const { endpoint, keys: { auth, p256dh } } = ctx.request.body;
  await db.deletePushSubscription(endpoint, auth, p256dh);
  ctx.body = { status: true };
});

router.get('/articles', async ctx => {
  console.log('\nGET /articles');
  ctx.body = await db.getArticles();
}).get('/articles/:id', async ctx => {
  const id = ctx.params.id;
  console.log(`\nGET /articles/${id}`);
  ctx.body = await db.getArticle(id);
}).post('/articles', async ctx => {
  console.log('\nPOST /articles');
  const { title, tag, content } = ctx.request.body;
  const id = await db.createArticle(title, tag, content);
  push.sendMessage({
    type: 'article',
    method: 'create',
    content: `新增文章：${title}`,
    id
  });
  ctx.body = { status: true };
}).put('/articles/:id', async ctx => {
  const id = ctx.params.id;
  console.log(`\nPUT /articles/${id}`);
  const { title, tag, content } = ctx.request.body;
  await db.updateArticle(id, title, tag, content);
  push.sendMessage({
    type: 'article',
    method: 'update',
    content: `更新文章：${title}`,
    id
  });
  ctx.body = { status: true };
}).delete('/articles/:id', async ctx => {
  const id = ctx.params.id;
  console.log(`\nDELETE /articles/${id}`);
  await db.deleteArticle(id);
  push.sendMessage({
    type: 'article',
    method: 'delete',
    content: `删除文章：${title}`
  });
  ctx.body = { status: true };
});

app.use(json());
app.use(bodyParser());
app.use(serve('client'));
app.use(router.routes());

Promise.all([
  db.setup(),
  push.setup()
]).then(() => {
  app.listen(8086, () => {
    console.log('\nExample app running on http://127.0.0.1:8086\n');
  });
});