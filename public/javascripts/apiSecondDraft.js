// eslint-disable-next-line no-unused-vars
let API = {
  async getAllTodos() {
    let response = await fetch('/api/todos');
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Getting all todos failed');
    }
  },
  async createNewTodo(json) {
    let response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: json,
    });

    if (response.ok) {
      return response.json();
    } else if (JSON.parse(json).title.length < 3) {
      throw new Error('You must enter a title at least 3 characters long.');
    } else {
      throw new Error('Submission failed.');
    }
  },
  async editTodo(json, id) {
    let response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: json,
    });

    if (response.ok) {
      return response.json();
    } else if (JSON.parse(json).title.length < 3) {
      throw new Error('You must enter a title at least 3 characters long.');
    } else {
      throw new Error('Update failed.');
    }
  },
  async deleteTodo(id) {
    let response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      return response;
    } else {
      throw new Error('Deletion failed - todo could not be found');
    }
  },
  async updateCompletion(id, json) {
    let response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: json,
    });

    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Update failed.');
    }
  }
};