const Koa = require('koa');
const Router = require('koa-router');
const json = require('koa-json');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const db = require('./db');
const push = require('./push');

const app = new Koa();
app.use(json());
app.use(bodyParser());
app.use(serve('../client'));

Promise.all([
  db.setup(),
  push.setup()
]).then(() => {
  app.listen(8086, () => {
    console.log('\nExample app running on http://127.0.0.1:8086\n');
  });
}).catch(() => {
  console.log('db setup faild');
});