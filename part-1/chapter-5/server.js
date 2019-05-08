const Koa = require('koa');
const Router = require('koa-router');
const json = require('koa-json');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');

const webpush = require('web-push');

const app = new Koa();
const router = new Router();

webpush.setVapidDetails(
  'mailto:hzlhu.dargon@gmail.com',
  'BLW2Nfw3ylyUdwNqAreIPYbemxnxQ7ZTZSIJIHxrgw_xOiUP9enenF5JIHX8KXY8BZpzuGN_0mCehb2XEqms3hg',
  'LBj1P1XVRmIir5zxSAGQMvLdwxC87hU6tZYJzxO6NQ4'
);

let subscription = null
const languages = ['C++', 'Java', 'JavaScript', 'Swift', 'Kotlin', 'Rust'];

function pushMessage(data) {
  webpush.sendNotification(subscription, JSON.stringify(data), { proxy: 'http://127.0.0.1:1087' }).then(response => {
    console.log('\nThe data send successfully:', JSON.stringify(data));
  }).catch(err => {
    console.log('\nThe data send failed:', err);
  });
}

router
  .post('/push', ctx => {
    console.log('\nThe push request is triggered...');
    pushMessage({
      message: languages[Math.min(languages.length - 1, Math.floor(Math.random() * 10))],
      type: 'vote'
    });
    ctx.body = { status: true };
  })
  .post('/subscribe', ctx => {
    console.log('\nThe subscribe request is triggered...');
    subscription = ctx.request.body;
    pushMessage({
      message: '感谢订阅^ _ ^',
      type: 'subscribe'
    });
    ctx.body = { status: true };
  });

app.use(json());
app.use(bodyParser());
app.use(serve('./src'));
app.use(router.routes());

app.listen(8085, () => {
  console.log('\nExample app running on http://127.0.0.1:8085\n');
});