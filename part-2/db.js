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
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )`
    ),
    _exec(
      'run',
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(100) UNIQUE NOT NULL,
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

function createArticle(title, content) {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return _exec(
    'run',
    'INSERT INTO articles (title, content, created_at, updated_at) VALUES ($title, $content, $createdAt, $updatedAt)',
    {
      $title: title,
      $content: content,
      $createdAt: now,
      $updatedAt: now
    }
  );
}

function updateArticle(id, title, content) {
  return _exec(
    'run',
    'UPDATE articles set title=$title, content=$content, updated_at=$updatedAt WHERE id=$id',
    {
      $id: id,
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

function createPushSubscription(id, endpoint, auth, p256dh) {
  return _exec(
    'run',
    'INSERT OR REPLACE INTO push_subscriptions (id, endpoint, auth, p256dh) VALUES ($id, $endpoint, $auth, $p256dh)',
    {
      $id: id,
      $endpoint: endpoint,
      $auth: auth,
      $p256dh: p256dh
    }
  );
}

function deletePushSubscription(id) {
  return _exec(
    'run',
    'DELETE FROM push_subscriptions WHERE id=$id',
    { $id: id }
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