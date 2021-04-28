"use strict";
/* eslint-disable camelcase */

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
};

let Todos = (() => {
  let todos = [];

  let validDueDate = function(month, year) {
    return !!month && !!year && month !== '00' && year !== '0000';
  };

  let addDueDate = function(todo) {
    if (validDueDate(todo.month, todo.year)) {
      todo['due_date'] = todo.month + '/' + todo.year.slice(-2);
    } else {
      todo['due_date'] = 'No Due Date';
    }
    return todo;
  };

  return {
    setTodos(json) {
      todos = json.map(addDueDate);
    },
    addTodo(json) {
      let todo = addDueDate(json);
      todos.push(todo);
    },
    getTodoIdx(id) {
      return todos.findIndex(todo => String(todo.id) === String(id));
    },
    deleteTodo(todoId) {
      let idx = this.getTodoIdx(todoId);
      todos.splice(idx, 1);
    },
    editTodo(json) {
      let newTodo = addDueDate(json);
      let idx = this.getTodoIdx(json.id);
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
    getDueYear(date) {
      return parseInt(date.split('/')[1], 10);
    },
    getDueMonth(date) {
      return parseInt(date.split('/')[0], 10);
    },
    getUniqueDates(todoArray) {
      let dates = [... new Set(todoArray.map(({due_date}) => due_date))];
      return dates.sort((a, b) => {
        if (a === 'No Due Date') {
          return -1;
        } else if (b === 'No Due Date') {
          return 1;
        } else if (this.getDueYear(a) < this.getDueYear(b)) {
          return -1;
        } else if (this.getDueYear(a) > this.getDueYear(b)) {
          return 1;
        } else if (this.getDueMonth(a) < this.getDueMonth(b)) {
          return -1;
        } else if (this.getDueMonth(a) > this.getDueMonth(b)) {
          return 1;
        } else {
          return 0;
        }
      });

    },
    getAllByDate() {
      let result = {};

      let uniqueDates = this.getUniqueDates(todos);

      uniqueDates.forEach(date => {
        let matchingTodos = todos.filter(({due_date}) => date === due_date);
        result[date] = matchingTodos;
      });

      return result;
    },
    getDoneByDate() {
      let result = {};

      let doneTodos = this.getDoneTodos();
      let uniqueDates = this.getUniqueDates(doneTodos);

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
    sortSelected(todos) {
      return todos.sort((a, b) => {
        if (a.completed && !b.completed) {
          return 1;
        } else if (!a.completed && b.completed) {
          return -1;
        } else {
          return 0;
        }
      });
    },
    getSelected(title, completed) {
      let selected;

      if (title === 'All Todos') {
        selected = this.getAllTodos();
      } else if (title === 'Completed') {
        selected = this.getDoneTodos();
      } else if (completed) {
        selected = this.getDoneByDate()[title];
      } else {
        selected = this.getAllByDate()[title];
      }

      if (selected) {
        this.sortSelected(selected);
      }

      return selected;
    },
  };
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
        this.templates[id] = Handlebars.compile(element.innerHTML);
      }
    });
  },
  removeActive() {
    let currentActive = document.querySelector('.active');
    if (currentActive) {
      currentActive.classList.remove('active');
    }
  },
  makeActive(title, completed) {
    this.removeActive();

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

    if (activeElement) {
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
    form.reset();
  },
  fillForm(todo) {
    let form = document.querySelector('form');
    form.dataset.id = todo.id;
    form.querySelector('input#title').value = todo.title;

    form.querySelector('select#due_day').value = todo.day || 'Day';
    form.querySelector('select#due_month').value = todo.month || 'Month';
    form.querySelector('select#due_year').selectedIndex = parseInt(todo.year.slice(-2), 10) - 13 || 'Year';
    form.querySelector('textarea').value = todo.description || '';
  },
  init() {
    this.setTemplates();
    return this;
  },
};

let formDataToJSON = function(formData) {
  let result = {};
  formData.forEach((val, key) => {
    if (key.match('_')) {
      let validKey = key.split('_').slice(-1)[0];

      if (/\d/.test(val)) {
        result[validKey] = val;
      } else {
        result[validKey] = '';
      }
    } else {
      result[key] = val;
    }
  });
  return result;
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

        let selected = this.todos.getSelected('All Todos');
        let current_section = { title: 'All Todos', data: selected.length };

        let data = {
          todos: this.todos.getAllTodos(),
          done: this.todos.getDoneTodos(),
          todos_by_date: this.todos.getAllByDate(),
          done_todos_by_date: this.todos.getDoneByDate(),
          selected,
          current_section,
        };

        let HTML = this.ui.templates['main_template'](data);
        document.body.innerHTML = HTML;
        this.ui.makeActive("All Todos");
      });
  },
  repaintPage(title = 'All Todos', completed) {
    if (this.todos.invalidTitle(title, completed)) {
      title = 'All Todos';
    }

    let selected = this.todos.getSelected(title, completed);
    let current_section = { title, data: selected.length };

    let data = {
      todos: this.todos.getAllTodos(),
      done: this.todos.getDoneTodos(),
      todos_by_date: this.todos.getAllByDate(),
      done_todos_by_date: this.todos.getDoneByDate(),
      selected,
      current_section,
    };

    let HTML = this.ui.templates['main_template'](data);
    document.body.innerHTML = HTML;
    this.ui.makeActive(title, completed);
  },
  bindClickListener() {
    document.body.addEventListener('click', this.clickEventListener.bind(this));
  },
  bindSubmitListener() {
    document.body.addEventListener('submit', this.handleSubmitEvent.bind(this));
  },
  getClickParents() {
    let deleteCells = [...document.querySelectorAll('.delete')];
    let newItem = document.querySelector('label[for="new_item"]');
    let sideBar = document.querySelector('#sidebar');
    let rows = [...document.querySelectorAll('tr[data-id]')];
    return [deleteCells, newItem, sideBar, rows];
  },
  clickEventType(event) {
    let [deleteCells, newItem, sideBar, rows] = this.getClickParents();

    if (event.target.id === 'modal_layer') {
      return 'modal';
    } else if (event.target.tagName === 'LABEL' && event.target.parentElement.classList.contains('list_item')) {
      return 'editItem';
    } else if (event.target.tagName === 'BUTTON' && event.target.name === 'complete') {
      return 'markAsComplete';
    } else if (deleteCells.some(cell => cell.contains(event.target))) {
      return 'handleDelete';
    } else if (newItem.contains(event.target)) {
      return 'handleNewItem';
    } else if (sideBar.contains(event.target)) {
      return 'handleSidebar';
    } else if (rows.some(row => row.contains(event.target))) {
      return 'handleToggleComplete';
    }

    return '';
  },
  handleClickEvent(event) {
    switch (this.clickEventType(event)) {
      case 'modal':                this.ui.hideForm();
        break;
      case 'editItem':             this.handleEditItem(event);
        break;
      case 'markAsComplete':       this.handleMarkAsComplete(event);
        break;
      case 'handleDelete':         this.handleDelete(event);
        break;
      case 'handleNewItem':        this.handleNewItem();
        break;
      case 'handleSidebar':        this.handleSidebar(event);
        break;
      case 'handleToggleComplete': this.handleToggleComplete(event);
        break;
    }
  },
  clickEventListener(event) {
    if (event.target.getAttribute('type') === 'submit') {
      return;
    }
    event.preventDefault();

    this.handleClickEvent(event);
  },
  updateTodo(id, data) {
    let activeElement = this.ui.getActive();
    if (!data.month && !data.year) {
      data.month = '00';
      data.year = '0000';
    }

    let json = JSON.stringify(data);

    this.api.editTodo(json, id)
      .then(responseJson => {
        this.ui.hideForm();
        this.todos.editTodo(responseJson);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });
  },
  createTodo(data) {
    let json = JSON.stringify(data);
    this.api.createNewTodo(json)
      .then(responseJson => {
        this.ui.hideForm();
        this.todos.addTodo(responseJson);
        this.repaintPage('All Todos');
      }).catch((err) => {
        alert(String(err));
      });
  },
  handleSubmitEvent(event) {
    event.preventDefault();

    let form = document.querySelector('form');
    let id = form.dataset.id;
    let formData = new FormData(form);
    let json = formDataToJSON(formData);

    if (id) {
      this.updateTodo(id, json);
    } else {
      this.createTodo(json);
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

      let data = { id: itemId, completed: 'true' };
      let json = JSON.stringify(data);
      this.api.editTodo(json, itemId)
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
  updateCompletionStatus(id, activeElement, status) {
    let data = { id, completed: status };
    let json = JSON.stringify(data);
    this.api.editTodo(json, id)
      .then(json => {
        this.todos.editTodo(json);
        this.repaintPage(activeElement.title, activeElement.completed);
      })
      .catch((err) => {
        alert(String(err));
      });
  },
  handleToggleComplete(event) {
    let itemId = event.target.closest('tr').dataset.id;
    let todo = this.todos.getTodo(itemId);
    let completed = todo.completed;

    let activeElement = this.ui.getActive();

    if (completed) {
      this.updateCompletionStatus(itemId, activeElement, 'false');
    } else {
      this.updateCompletionStatus(itemId, activeElement, 'true');
    }
  },
  validSidebarClick(event) {
    let allLists = document.querySelector('#all_lists');
    let allTodos = document.querySelector('#all_todos');
    let completedLists = document.querySelector('#completed_lists');
    let completedTodos = document.querySelector('#completed_todos');
    let validContainers = [allLists, allTodos, completedLists, completedTodos];

    let valid = validContainers.some((container) =>
      container.contains(event.target)
    );
    return valid;
  },
  handleSidebar(event) {
    if (this.validSidebarClick(event)) {
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