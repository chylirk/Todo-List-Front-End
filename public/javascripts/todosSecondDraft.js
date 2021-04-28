/* eslint-disable camelcase */
// eslint-disable-next-line no-unused-vars
let Todos = (() => {
  let todos = [];

  let validDueDate = function(month, year) {
    return !!month && !!year && month !== '00' && year !== '0000';
  };

  let addDueDate = function(todos) {
    return todos.map(todo => {
      if (validDueDate(todo.month, todo.year)) {
        todo['due_date'] = todo.month + '/' + todo.year.slice(-2);
      } else {
        todo['due_date'] = 'No Due Date';
      }
      return todo;
    });
  };

  return {
    setTodos(json) {
      todos = addDueDate(json);
    },
    addTodo(json) {
      let todo = addDueDate([json])[0];
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
      let newTodo = addDueDate([json])[0];
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