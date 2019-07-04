const Koa = require('koa');
const path = require('path');
const fs = require('fs-extra');
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

async function renderPage(ctx, type, content) {
  if (parseInt(ctx.request.headers['only_content'], 10) === 1) {
    ctx.body = content;
  } else {
    const rootPath = path.join(__dirname, '../public/shell');
    const top = await fs.readFile(path.join(rootPath, `${type}_top.html`), 'utf-8');
    const bottom = await fs.readFile(path.join(rootPath, `${type}_bottom.html`), 'utf-8');
    ctx.body = `${top}${content}${bottom}`;
  }
}

async function renderEditPage(ctx, id) {
  const article = id ? await db.getArticle(id) : {};
  const content = `<div class="input">
      <input class="title" type="text" placeholder="标题" value="${id ? article.title : ''}"/>
    </div>
    <div class="input">
      <textarea class="content" placeholder="正文">${id ? article.content : ''}</textarea>
    </div>
    <div class="actions">
      <button class="save">保存</button>
      ${id ? '<button class="delete">删除</button>' : ''}
    </div>`;
  await renderPage(ctx, 'edit', content);
}

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

router.post('/articles', async ctx => {
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

router.get('/', async ctx => {
  const articles = await db.getArticles();
  let content = '<div class="message">暂无任何数据</div>';
  if (Array.isArray(articles) && articles.length > 0) {
    content = articles.reduce((result, item) => {
      result += `<div class="item" onclick="onListItemClicked(${item.id})">
        <div class="title">${item.title}</div>
        <div class="content">${item.content}</div>
        <div class="times">
          <div>首发于：${item.created_at}</div>
          <div>更新于：${item.created_at}</div>
        </div>
      </div>`;
      return result;
    }, '<div class="list">') + '</div>';
  }
  await renderPage(ctx, 'home', content);
});

router.get('/create', async ctx => {
  await renderEditPage(ctx, null);
});

router.get('/detail/:id', async ctx => {
  const article = await db.getArticle(ctx.params.id);
  let content = '<div class="message">暂无任何数据</div>';
  if (article) {
    content = `<div class="detail">
      <div class="title">${article.title}</div>
      <div class="times">
        <div>首发于：${article.created_at}</div>
        <div>更新于：${article.updated_at}</div>
      </div>
      <div class="content">${article.content}</div>`;
  }
  await renderPage(ctx, 'detail', content);
});

router.get('/edit/:id', async ctx => {
  await renderEditPage(ctx, ctx.params.id);
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