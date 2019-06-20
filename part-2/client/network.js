const Network = {
  subscribe(subscription) {
    return fetch('/subscribe', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(subscription)
    }).then(response => response.json());
  },

  unsubscribe(subscription) {
    return fetch('/subscribe', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'DELETE',
      body: JSON.stringify(subscription)
    }).then(response => response.json());
  },

  saveArticle(article) {
    const { id } = article;
    if (id) {
      return fetch(`/articles/${id}`, {
        headers: {
          'content-type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify(article)
      }).then(response => response.json());
    }

    return fetch('/articles', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(article)
    }).then(response => response.json());
  },

  deleteArticle(data) {
    return fetch(`/articles/${data.id}`, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'DELETE',
    }).then(response => response.json());
  }
}