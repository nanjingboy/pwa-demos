const network = {

  getTodos() {
    return fetch('/todos').then(function(response) {
      return response.json();
    });
  },

  addTodos(todos) {
    return fetch('/todos', {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(todos)
    }).then(function(response) {
      return response.json();
    });
  }
};
