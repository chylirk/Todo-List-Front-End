/* eslint-disable no-undef */
/* eslint-disable camelcase */
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
  invalidTitle(title, completed) {
    return (
      this.ui.invalidTitle(title, completed) ||
      this.todos.invalidTitle(title, completed)
    );
  },
  repaintPage(title = 'All Todos', completed) {
    if (this.invalidTitle(title, completed)) {
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
      this.api.updateCompletion(id, json)
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
    this.api.updateCompletion(id, json)
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