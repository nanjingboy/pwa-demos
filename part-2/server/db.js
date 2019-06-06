const dayjs = require('dayjs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

function _exec(fn, sql, params) {
  return new Promise((resolve, reject) => {
    db[fn](sql, params, function(error, result) {
      if (error === null) {
        if (this.sql.toLocaleLowerCase().indexOf('insert') === 0) {
          resolve(this.lastID);
        } else {
          resolve(result);
        }
      } else {
        reject(error);
      }
    });
  });
}

function setup() {
  return Promise.all([
    _exec(
      'run',
      `CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(100) NOT NULL,
        tag VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )`
    ),
    _exec(
      'run',
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint VARCHAR(100) NOT NULL,
        auth VARCHAR(100) NOT NULL,
        p256dh VARCHAR(100) NOT NULL
      )`
    )
  ]);
}

function getArticles() {
  return _exec('all', 'SELECT * FROM articles');
}

function getArticle(id) {
  return _exec('get', 'SELECT * FROM articles WHERE id=$id', { $id: id });
}

function createArticle(title, tag, content) {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return _exec(
    'run',
    `INSERT INTO articles (
      title, tag, content, created_at, updated_at
    ) VALUES ($title, $tag, $content, $createdAt, $updatedAt)`,
    {
      $title: title,
      $tag: tag,
      $content: content,
      $createdAt: now,
      $updatedAt: now
    }
  );
}

function updateArticle(id, title, tag, content) {
  return _exec(
    'run',
    `UPDATE articles SET
      title=$title,
      tag=$tag,
      content=$content,
      updated_at=$updatedAt
      WHERE id=$id`,
    {
      $id: id,
      $tag: tag,
      $title: title,
      $content: content,
      $updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
  );
}

function deleteArticle(id) {
  return _exec(
    'run',
    'DELETE FROM articles WHERE id=$id',
    { $id: id }
  );
}

function getPushSubscriptions() {
  return _exec('all', 'SELECT * FROM push_subscriptions');
}

function createPushSubscription(endpoint, auth, p256dh) {
  return _exec(
    'run',
    `INSERT INTO push_subscriptions (
      endpoint, auth, p256dh
    ) VALUES ($endpoint, $auth, $p256dh)`,
    {
      $endpoint: endpoint,
      $auth: auth,
      $p256dh: p256dh
    }
  );
}

function deletePushSubscription(endpoint, auth, p256dh) {
  return _exec(
    'run',
    'DELETE FROM push_subscriptions WHERE endpoint=$endpoint AND auth=$auth AND p256dh=$p256dh',
    {
      $endpoint: endpoint,
      $auth: auth,
      $p256dh: p256dh
    }
  );
}

module.exports = {
  setup,
  getArticle,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getPushSubscriptions,
  createPushSubscription,
  deletePushSubscription,
};