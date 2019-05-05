const ui = {

  render(todos) {
    if (todos.length === 0) {
      document.getElementById('list').innerHTML = '暂无待办事项';
    } else {
      document.getElementById('list').innerHTML = todos.map(function(todo) {
        return `<div class="item">${todo.name}（#${todo.id}）</div>`;
      }).join('');
    }
  },

  submit(callback) {
    const name = document.getElementById('name').value.trim();
    if (name.length === 0) {
      alert('待办事项不能为空');
    } else {
      callback(name);
    }
  }
};
