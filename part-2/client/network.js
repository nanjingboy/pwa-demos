function fetchWrapper(url, options) {
  return fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json'
    }
  }).then(async response => {
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  })
}

const Network = {
  subscribe(subscription) {
    return fetchWrapper('/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });
  },

  unsubscribe(subscription) {
    return fetchWrapper('/subscribe', {
      method: 'DELETE',
      body: JSON.stringify(subscription)
    });
  },

  saveArticle(article) {
    const { id } = article;
    if (id) {
      return fetchWrapper(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article)
      });
    }

    return fetchWrapper('/articles', {
      method: 'POST',
      body: JSON.stringify(article)
    });
  },

  deleteArticle(data) {
    return fetch(`/articles/${data.id}`, {
      method: 'DELETE',
    });
  }
}