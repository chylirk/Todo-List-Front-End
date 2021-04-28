// eslint-disable-next-line no-unused-vars
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