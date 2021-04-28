"use strict";

let formDataToJSON = function(formData) {
  let result = {};
  formData.forEach((val, key) => {
    if (key.match('_')) {
      let validKey = key.split('_').slice(-1)[0];
      if (/\d/.test(val)) {
        result[validKey] = val;
      } else {
        result[validKey] = '';
      };
    } else {
      result[key] = val;
    }
  });
  return result;
}

let API = {
  async getAllTodos() {
    let response = await fetch('/api/todos');
    if (response.ok) {
      return response.json();
    } else {
      debugger;
    }
  },
  async createNewTodo(data) {
    let response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      return response.json();
    } else {
      if (data.title.length < 3) {
        throw new Error('You must enter a title at least 3 characters long.');
      } else {
        throw new Error('Submission failed.');
      }
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
  async editTodo(data, id) {
    let response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return response.json();
    } else {
      if (data.title.length < 3) {
        throw new Error('You must enter a title at least 3 characters long.');
      } else {
        throw new Error('Update failed.');
      }
    }
  },
  async markAsComplete(id) {
    let data = { id, completed: 'true' };
    let response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Completion failed');
    }
  },
  async markAsIncomplete(id) {
    let data = { id, completed: 'false' };
    let response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Marking as Incomplete failed');
    }
  },
}

let Todos = (() => {
  let todos = [];

  let validDueDate = function(month, year) {
    return !!month && !!year && month !== '00' && year !== '0000';
  }

  let addDueDate = function(todos) {
    return todos.map(todo => {
      // if (todo.month && todo.year) {
      if (validDueDate(todo.month, todo.year)) {
        todo['due_date'] = todo.month + '/' + todo.year.slice(-2);
      } else {
        todo['due_date'] = 'No Due Date';
      }
      // if (todo.month && todo.year) {
      //   todo['due_date'] = todo.month + '/' + todo.year.slice(-2);
      // } else {
      //   todo['due_date'] = 'No Due Date';
      // }
      return todo;
    })
  };

  return {
    setTodos(json) {
      todos = addDueDate(json);
    },
    addTodo(json) {
      let todo = addDueDate([json])[0];
      todos.push(todo);
    },
    deleteTodo(todoId) {
      let idx = todos.findIndex(todo => String(todo.id) === todoId);
      todos.splice(idx, 1);
    },
    editTodo(json) {
      let newTodo = addDueDate([json])[0];
      let idx = todos.findIndex(todo => todo.id === json.id);
      todos.splice(idx, 1, newTodo);
    },
    getTodo(todoId) {
      let todo = todos.filter(({id}) => String(id) === todoId)[0];
      return Object.assign({}, todo);
    },
    getAllTodos() {
      return [...todos];
    },
    getDoneTodos() {
      return [...todos.filter(({completed}) => completed)];
    },
    getAllByDate() {
      let result = {};

      let uniqueDates = [... new Set(todos.map(({due_date}) => due_date))];
      if (uniqueDates) {
        uniqueDates.sort((a, b) => {
          if (a === 'No Due Date') {
            return -1 
          } else if (b === 'No Due Date') {
            return 1
          } else if (parseInt(a.split('/')[1], 10) < parseInt(b.split('/')[1], 10)) {
            return -1;
          } else if (parseInt(a.split('/')[1], 10) > parseInt(b.split('/')[1], 10)) {
            return 1;
          } else if (parseInt(a.split('/')[0], 10) < parseInt(b.split('/')[0], 10)) {
            return -1;
          } else if (parseInt(a.split('/')[0], 10) > parseInt(b.split('/')[0], 10)) {
            return 1;
          } else {
            return 0;
          }
        });
      }

      uniqueDates.forEach(date => {
        let matchingTodos = todos.filter(({due_date}) => date === due_date);
        result[date] = matchingTodos;
      });


      return result;
    },
    getDoneByDate() {
      let result = {};

      let doneTodos = this.getDoneTodos();
      let uniqueDates = [... new Set(doneTodos.map(({due_date}) => due_date))];

      if (uniqueDates) {
        uniqueDates.sort((a, b) => {
          if (a === 'No Due Date') {
            return -1 
          } else if (b === 'No Due Date') {
            return 1
          } else if (parseInt(a.split('/')[1], 10) < parseInt(b.split('/')[1], 10)) {
            return -1;
          } else if (parseInt(a.split('/')[1], 10) > parseInt(b.split('/')[1], 10)) {
            return 1;
          } else if (parseInt(a.split('/')[0], 10) < parseInt(b.split('/')[0], 10)) {
            return -1;
          } else if (parseInt(a.split('/')[0], 10) > parseInt(b.split('/')[0], 10)) {
            return 1;
          } else {
            return 0;
          }
        });
      }

      uniqueDates.forEach(date => {
        let matchingTodos = doneTodos.filter(({due_date}) => date === due_date);
        result[date] = matchingTodos;
      });

      return result;
    },
    invalidTitle(title, completed) {
      if (["All Todos", "Completed"].includes(title)) {
        return false;
      } else if (completed) {
        let todos = this.getDoneByDate()[title];
        if (!todos) {
          return true;
        } else {
          return todos.length === 0;
        }
      } else {
        let todos = this.getAllByDate()[title];
        if (!todos) {
          return true;
        } else {
          return todos.length === 0;
        }
      }
    },
  }
})();

let UI = {
  templates: {},
  setTemplates() {
    let templateElements = document.querySelectorAll("[type='text/x-handlebars']");

    templateElements.forEach(element => {
      let id = element.getAttribute('id');
      let dataType = element.getAttribute('data-type');

      if (dataType === 'partial') {
        Handlebars.registerPartial(id, element.innerHTML);
      } else {
        this.templates[id] = (Handlebars.compile(element.innerHTML));
      }
    });
  },
  makeActive(title, completed) {
    let currentActive = document.querySelector('.active');
    if (currentActive) {
      currentActive.classList.remove('active');
    }

    let element;
    if (["All Todos", "Completed"].includes(title)) {
      element = document.querySelector(`[data-title="${title}"]`);
    } else if (completed) {
      let parent = document.querySelector('#completed_lists');
      element = parent.querySelector(`[data-title="${title}"]`);
    } else {
      let parent = document.querySelector('#all_lists');
      element = parent.querySelector(`[data-title="${title}"]`);
    }
    element.classList.add('active');
  },
  getActive() {
    let active = {};
    let activeElement = document.querySelector('.active');

    if (!activeElement) {
      active['title'] = '';
      active['completed'] = '';
    } else {
      let title = activeElement.dataset.title;
      active['title'] = title;

      if (['All Todos', 'Completed'].includes(title)) {
        active['completed'] = '';
      } else {
        let parentArticle = activeElement.closest('article');

        if (parentArticle.id === 'all_lists') {
          active['completed'] = false;
        } else {
          active['completed'] = true;
        }
      }
    }

    return active;
  },
  fadeIn(element) {
    element.style.opacity = 0;
    element.style.display = 'block';
    (function fade() {
      let currentOpacity = parseFloat(element.style.opacity, 10);
      if (currentOpacity + 0.1 <= 1) {
        element.style.opacity = currentOpacity + 0.1;
        requestAnimationFrame(fade);
      }
    })();
  },
  fadeOut(element) {
    element.style.opacity = 1;
    (function fade() {
      let currentOpacity = parseFloat(element.style.opacity, 10);
      if (currentOpacity - 0.1 <= 0) {
        element.style.display = 'none';
      } else {
        element.style.opacity = currentOpacity - 0.1;
        requestAnimationFrame(fade);
      }
    })();
  },
  displayForm() {
    let modalLayer = document.querySelector('#modal_layer');
    let formModal = document.querySelector('#form_modal');
    this.fadeIn(modalLayer);
    this.fadeIn(formModal);
    formModal.style.top = '200px';
  },
  hideForm() {
    let modalLayer = document.querySelector('#modal_layer');
    let formModal = document.querySelector('#form_modal');
    let form = document.querySelector('form');
    this.fadeOut(modalLayer);
    this.fadeOut(formModal);
    form.dataset.id = '';
  },
  fillForm(todo) {
    let form = document.querySelector('form');
    form.dataset.id = todo.id;
    form.querySelector('input#title').value = todo.title;

    if (!!todo.day) {
      form.querySelector('select#due_day').value = todo.day
    }
    if (!!todo.month) {
      form.querySelector('select#due_month').value = todo.month
    }
    if (!!todo.year) {
      form.querySelector('select#due_year').selectedIndex = parseInt(todo.year.slice(-2), 10) - 13;
    }
    if (!!todo.description) {
      form.querySelector('textarea').value = todo.description;
    }
  },
  invalidTitle(title, completed) {
    if (["All Todos", "Completed"].includes(title)) {
      return false;
    } else if (completed) {
      let parent = document.querySelector('#completed_lists');
      return !parent.querySelector(`[data-title="${title}"]`);
    } else {
      let parent = document.querySelector('#all_lists');
      return !parent.querySelector(`[data-title="${title}"]`);
    }
  },
  init() {
    this.setTemplates();
    return this;
  },
};

let App = {
  init() {
    this.api = Object.create(API);
    this.todos = Object.create(Todos);
    this.ui = Object.create(UI).init();


    this.bindClickListener();
    this.bindSubmitListener();
    this.initializeTodosAndPage();
    return this;
  },
  initializeTodosAndPage() {
    this.api.getAllTodos()
    .then(json => {
      this.todos.setTodos(json);

      let selected = this.getSelected('All Todos');
      let current_section = { title: 'All Todos', data: selected.length };

      let data = {
        todos: this.todos.getAllTodos(),
        done: this.todos.getDoneTodos(),
        todos_by_date: this.todos.getAllByDate(),
        done_todos_by_date: this.todos.getDoneByDate(),
        selected,
        current_section,
      }

      let HTML = this.ui.templates['main_template'](data);
      document.body.innerHTML = HTML;
      this.ui.makeActive("All Todos");
    });
  },
  getSelected(title, completed) {
    let selected;

    if (title === 'All Todos') {
      selected = this.todos.getAllTodos();
    } else if (title === 'Completed') {
      selected = this.todos.getDoneTodos();
    } else if (completed) {
      selected = this.todos.getDoneByDate()[title];
    } else {
      selected = this.todos.getAllByDate()[title];
    }

    if (selected) {
      selected.sort((a, b) => {
        if (a.completed && !b.completed) {
          return 1;
        } else if (!a.completed && b.completed) {
          return -1;
        } else {
          return 0;
        }
      });
    }
    return selected;
  },
  repaintPage(title = 'All Todos', completed) {
    // defaults to All Todos if the previously active thing disappeared
    if (this.ui.invalidTitle(title, completed)) {
      title = 'All Todos';
    }

    if (this.todos.invalidTitle(title, completed)) {
      title = 'All Todos';
    }

    let selected = this.getSelected(title, completed);
    let current_section = { title, data: selected.length };

    let data = {
      todos: this.todos.getAllTodos(),
      done: this.todos.getDoneTodos(),
      todos_by_date: this.todos.getAllByDate(),
      done_todos_by_date: this.todos.getDoneByDate(),
      selected, 
      current_section,
    }

    let HTML = this.ui.templates['main_template'](data);
    document.body.innerHTML = HTML;
    this.ui.makeActive(title, completed);
  },
  bindClickListener() {
    document.body.addEventListener('click', this.handleClickEvent.bind(this));
  },
  bindSubmitListener() {
    document.body.addEventListener('submit', this.handleSubmitEvent.bind(this));
  },
  handleClickEvent(event) {
    // don't want to accidentally prevent a submit event
    if (event.target.getAttribute('type') === 'submit') {
      return;
    }

    event.preventDefault();

    if (event.target.id === 'modal_layer') {
      document.querySelector('form').reset();
      this.ui.hideForm();
      return;
    }

    if (event.target.tagName === 'LABEL' && event.target.parentElement.classList.contains('list_item')) {
      this.handleEditItem(event);
      return;
    }

    if (event.target.tagName === 'BUTTON' && event.target.name === 'complete') {
      this.handleMarkAsComplete(event);
      return;
    }

    let deleteCells = [...document.querySelectorAll('.delete')];
    if (deleteCells.some(cell => cell.contains(event.target))) {
      this.handleDelete(event);
      return;
    }

    let newItem = document.querySelector('label[for="new_item"]');
    if (newItem.contains(event.target)) {
      this.handleNewItem();
      return;
    }

    let sideBar = document.querySelector('#sidebar');
    if (sideBar.contains(event.target)) {
      this.handleSidebar(event);
      return;
    }

    let rows = [...document.querySelectorAll('tr[data-id]')];
    if (rows.some(row => row.contains(event.target))) {
      this.handleToggleComplete(event);
      return;
    };
  },
  handleSubmitEvent(event) {
    event.preventDefault();

    let form = document.querySelector('form');
    let id = form.dataset.id;
    let formData = new FormData(form);
    let json = formDataToJSON(formData);

    if (id) {
      let activeElement = this.ui.getActive();
      if (json.month === '' && json.year === '') {
        json.month = '00';
        json.year = '0000';
      }

      this.api.editTodo(json, id)
      .then(responseJson => {
        this.ui.hideForm();
        this.todos.editTodo(responseJson);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });
    } else {
      this.api.createNewTodo(json)
      .then(responseJson => {
        this.ui.hideForm();
        this.todos.addTodo(responseJson);
        this.repaintPage('All Todos');
      }).catch((err) => {
        alert(String(err));
      });
    }
  },
  handleNewItem() {
    this.ui.displayForm();
  },
  handleEditItem(event) {
    let id = event.target.getAttribute('for').split('_').slice(-1)[0];
    let todo = this.todos.getTodo(id);
    this.ui.displayForm();
    this.ui.fillForm(todo);
  },
  handleDelete(event) {
    let id = event.target.closest('tr').dataset.id;
    let activeElement = this.ui.getActive();
    this.api.deleteTodo(id)
    .then(() => {
      this.todos.deleteTodo(id);
      this.repaintPage(activeElement.title, activeElement.completed);
    })
    .catch(err => {
      alert(String(err));
    });
  },
  handleMarkAsComplete(event) {
    let itemId = event.target.closest('form').dataset.id;

    if (!itemId) {
      alert('Cannot mark as complete as item has not been created yet!');
    } else {
      let activeElement = this.ui.getActive();

      this.api.markAsComplete(itemId)
      .then(json => {
        this.ui.hideForm();
        this.todos.editTodo(json);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });
    }
  },
  handleToggleComplete(event) {
    let itemId = event.target.closest('tr').dataset.id;
    let todo = this.todos.getAllTodos().filter(({id}) => String(id) === itemId)[0];
    let completed = todo.completed;

    let activeElement = this.ui.getActive();

    if (completed) {
      this.api.markAsIncomplete(itemId)
      .then(json => {
        this.todos.editTodo(json);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });

    } else {
      this.api.markAsComplete(itemId)
      .then(json => {
        this.todos.editTodo(json);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });
    }
  },
  handleSidebar(event) {
    let allLists = document.querySelector('#all_lists');
    let allTodos = document.querySelector('#all_todos');
    let completedLists = document.querySelector('#completed_lists');
    let completedTodos = document.querySelector('#completed_todos');
    let validContainers = [allLists, allTodos, completedLists, completedTodos];
    let valid = validContainers.some(container => container.contains(event.target));

    if (valid) {
      let closestTitle = event.target.closest('[data-title]');
      let title = closestTitle.dataset.title;
      let closestSection = event.target.closest('section');
      let completed;
      if (closestSection.id === 'completed_items') {
        completed = true;
      } else {
        completed = false;
      }

      this.repaintPage(title, completed);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Object.create(App).init();
});