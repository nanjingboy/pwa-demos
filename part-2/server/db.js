const path = require('path');
const dayjs = require('dayjs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'data.db'));

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
        key VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )`
    ),
    _exec(
      'run',
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint VARCHAR NOT NULL,
        auth VARCHAR NOT NULL,
        p256dh VARCHAR NOT NULL
      )`
    )
  ]);
}

function getArticles() {
  return _exec('all', 'SELECT * FROM articles ORDER BY updated_at DESC');
}

function getArticle(id) {
  return _exec('get', 'SELECT * FROM articles WHERE id=$id', { $id: id });
}

async function isArticleExists(key) {
  const { count } = await _exec(
    'get',
    'SELECT COUNT(key) AS count FROM articles WHERE key=$key',
    { $key: key }
  );
  return count > 0;
}

function createArticle(key, title, content) {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return _exec(
    'run',
    `INSERT INTO articles (
      key, title, content, created_at, updated_at
    ) VALUES ($key, $title, $content, $createdAt, $updatedAt)`,
    {
      $key: key,
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
    `UPDATE articles SET
      title=$title,
      content=$content,
      updated_at=$updatedAt
      WHERE id=$id`,
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
  isArticleExists,
  getPushSubscriptions,
  createPushSubscription,
  deletePushSubscription,
};