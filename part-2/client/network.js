const Network = {
  subscribe(subscription) {
    return  fetch('/subscribe', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(subscription)
    }).then(response => response.json());
  },

  unsubscribe(subscription) {
    return  fetch('/subscribe', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'DELETE',
      body: JSON.stringify(subscription)
    }).then(response => response.json());
  }
}