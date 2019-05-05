const Koa = require('koa');
const Router = require('koa-router');
const json = require('koa-json');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const todos = [];
router
  .get('/todos', ctx => {
    ctx.body = todos;
  })
  .post('/todos', ctx => {
    console.log('The post request is triggered...\n');
    ctx.request.body.forEach(({ name }) => {
      todos.push({ id: todos.length + 1, name });
    });
    ctx.body = todos;
  });

app.use(json());
app.use(bodyParser());
app.use(serve('./src'));
app.use(router.routes());

app.listen(8084, () => {
  console.log('\nExample app running on http://127.0.0.1:8084\n');
});