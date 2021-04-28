(async () => {
  await new Promise(res => window.addEventListener('load', res));
  await new Promise(res => setTimeout(res, 100));

  let delay = 200;

  let standardUICheck = function(mainTime, allCount, mainCount) {
    let time = document.querySelector('#items time');
    let headerCount = document.querySelector('#items').querySelector('dd');
    let allHeader = document.querySelector('#all_header');
    let activeHeaders = document.querySelectorAll('.active');
    let modalLayer = document.querySelector('#modal_layer');
    let formModal = document.querySelector('#form_modal');
    console.assert(time.textContent === mainTime, `Expected time to be ${mainTime}`);
    console.assert(allHeader.querySelector('dd').textContent === `${allCount}`, `Expected all header count to be ${allCount}`);
    console.assert(headerCount.textContent.match(/\d/)[0] === `${mainCount}`, `Expected main count to be ${mainCount}`);
    console.assert(activeHeaders.length === 1, 'Expected only 1 active header');
    console.assert(modalLayer.style.display === '', 'Expected modal layer display to be empty');
    console.assert(formModal.style.display === '', 'Expected modal form display to be empty');
    console.assert(document.querySelectorAll('.list_item').length === mainCount, `Expected ${mainCount} items`);
  };

  standardUICheck('All Todos', 0, 0);

  let allHeader = document.querySelector('#all_header');

  console.assert(allHeader.classList.contains('active'), 'Expected all header to be active');

  await new Promise(res => setTimeout(res, delay));

  let modalCheck = function() {
    let modalLayer = document.querySelector('#modal_layer');
    let formModal = document.querySelector('#form_modal');

    console.assert(modalLayer.style.display === 'block', 'Expected modal layer display to be block');
    console.assert(formModal.style.display === 'block', 'Expected modal form display to be block');
  };

  // Create a todo

  let createTodo = function(title, day = '', month = '', year = '', description = '') {
    let addNewTodo = document.querySelector('label[for="new_item"]');
    addNewTodo.click();
    modalCheck();

    let form = document.querySelector('form');
    form.querySelector('input#title').value = title;

    form.querySelector('select#due_day').value = day;
    form.querySelector('select#due_month').value = month;
    if (year) {
      form.querySelector('select#due_year').selectedIndex = parseInt(('20' + year).slice(-2), 10) - 13;
    }
    form.querySelector('textarea').value = description;

    let submitButton = document.querySelector('input[type="submit"]');
    submitButton.click();
  };

  let firstTitle = 'Test';
  let firstDay = '01';
  let firstMonth = '01';
  let firstYear = '18';
  let firstDescription = 'practice test';

  createTodo(firstTitle, firstDay, firstMonth, firstYear, firstDescription);

  await new Promise(res => setTimeout(res, delay));

  standardUICheck('All Todos', 1, 1);

  // Hovering on a todo item highlights the todo.
  // Clicking on the area surrounding the todo name
  //  toggles the todo state (complete/not complete).

  let listItem = document.querySelector('td.list_item');
  listItem.click();

  await new Promise(res => setTimeout(res, delay));
  let allDoneHeader = document.querySelector('#all_done_header');
  let allDoneCount = allDoneHeader.querySelector('dd').textContent;
  console.assert(allDoneCount === '1', 'Expected All Done Count to be 1');

  // The todo name displayed on the todo list is of the following form
  //    "{title} - {month}/{year}" (i.e., Item 1 - 02/15).
  listItem = document.querySelector('td.list_item');
  let itemName = listItem.querySelector('label').textContent;
  console.assert(itemName === `${firstTitle} - ${firstMonth}/${firstYear}`, 'Expected item name to be different');

  let completedList = document.querySelector('#completed_lists');
  let completedTime = completedList.querySelector('time');
  console.assert(completedTime.textContent === `${firstMonth}/${firstYear}`, 'Expected completed time to 01/18');

  // If the todo doesn't have both a month and year,
  //  the todo name displayed is of the form
  //  "{title} - No Due Date" (i.e., Item 3 - No Due Date).

  createTodo('Test Timeless');

  await new Promise(res => setTimeout(res, delay));

  standardUICheck('All Todos', 2, 2);
  console.assert(document.querySelector('#all_lists').querySelector('time').textContent === 'No Due Date', 'Expected no Due Date');

  // Hovering over the todo name highlights the text.
  //  Clicking it shows the modal with the corresponding todo details

  let firstLabel = document.querySelector('label[for^="item_"]');
  firstLabel.click();

  let checkForm = function(title, day, month, year, description) {
    modalCheck();
    let form = document.querySelector('form');

    let formTitle = form.querySelector('input#title').value;
    let formDay = form.querySelector('select#due_day').value;
    let formMonth = form.querySelector('select#due_month').value;
    let formYear = form.querySelector('select#due_year').value;
    let formDescription = form.querySelector('textarea').value;

    console.assert(formTitle === title, `Expected form title to be ${title}`);
    console.assert(formDay === day, `Expected form title to be ${day}`);
    console.assert(formMonth === month, `Expected form title to be ${month}`);
    console.assert(formYear === year, `Expected form title to be ${year}`);
    console.assert(formDescription === description, `Expected form title to be ${description}`);
  };

  checkForm('Test Timeless', 'Day', 'Month', 'Year', '');

  // When a todo is toggled/deleted
  //  the currently selected todo group should not change.
  allHeader = document.querySelector('#all_header');
  allHeader.click();
  standardUICheck('All Todos', 2, 2);

  listItem = document.querySelector('td.list_item');
  listItem.click();

  await new Promise(res => setTimeout(res, delay));
  allDoneHeader = document.querySelector('#all_done_header');
  allDoneCount = allDoneHeader.querySelector('dd').textContent;
  console.assert(allDoneCount === '2', 'Expected All Done Count to be 2');


  await new Promise(res => setTimeout(res, delay));
  let secondTitle = 'Test 2';
  let secondDay = '01';
  let secondMonth = '02';
  let secondYear = '18';
  let secondDescription = 'second practice test';

  createTodo(
    secondTitle,
    secondDay,
    secondMonth,
    secondYear,
    secondDescription
  );

  // click on completed todo for 01/18
  await new Promise(res => setTimeout(res, delay));
  let completed0118 = document.getElementById('01/18');
  completed0118.click();
  createTodo('Test 3', secondDay, secondMonth, secondYear, 'third practice test');

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('All Todos', 4, 4);

  // click on all 02/18 todos
  let all0218 = document.querySelector('[data-title="02/18"]');
  all0218.click();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('02/18', 4, 2);

  // validate deleting behavior
  let firstDelete = document.querySelector('.delete');
  firstDelete.click();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('02/18', 3, 1);

  // validate active changes to All Todo when last sub-category todo is deleted
  let lastDeleteButton = document.querySelector('.delete');
  lastDeleteButton.click();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('All Todos', 2, 2);

  // validating Completed click behavior
  allDoneHeader = document.querySelector('#all_done_header');
  allDoneHeader.click();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('Completed', 2, 2);

  // validate deleting the last 'completed' todo maintains 'Completed' as active
  let deleteAllVisible = function() {
    let deleteButtons = [...document.querySelectorAll('.delete')];
    deleteButtons.forEach(button => button.click());
  };

  deleteAllVisible();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('Completed', 0, 0);

  // validate that you can change a 'dated' todo to 'no due date'
  createTodo(firstTitle, firstDay, firstMonth, firstYear, firstDescription);

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('All Todos', 1, 1);

  firstLabel = document.querySelector('label[for^="item_"]');
  firstLabel.click();

  await new Promise(res => setTimeout(res, delay));

  let updateForm = function(todoObject) {
    let form = document.querySelector('form');
    let formValues = {};

    formValues['title'] = form.querySelector('input#title');
    formValues['day'] = form.querySelector('select#due_day');
    formValues['month'] = form.querySelector('select#due_month');
    formValues['year'] = form.querySelector('select#due_year');
    formValues['description'] = form.querySelector('textarea');

    for (let [key, value] of Object.entries(todoObject)) {
      formValues[String(key)].value = value;
    }

    let submitButton = document.querySelector('input[type="submit"]');
    submitButton.click();
  };

  let noDueDateData = {
    month: '',
    year: '',
  };

  updateForm(noDueDateData);

  // verify that the time changed to 'No Due Date'
  await new Promise(res => setTimeout(res, delay));
  listItem = document.querySelector('td.list_item');
  itemName = listItem.querySelector('label').textContent;
  console.assert(itemName === `${firstTitle} - No Due Date`, 'Expected item name to be different');

  listItem.click();

  await new Promise(res => setTimeout(res, delay));
  completedList = document.querySelector('#completed_lists');
  completedTime = completedList.querySelector('time');
  console.assert(completedTime.textContent === `No Due Date`, 'Expected completed time to No Due Date');

  // The todos in the main area should reflect what is currently selected,
  //  and the corresponding count of todos should reflect the count accordingly.
  allDoneHeader = document.querySelector('#all_done_header');
  allDoneHeader.click();
  standardUICheck('Completed', 1, 1);

  // validate competion status toggling
  listItem = document.querySelector('td.list_item');
  listItem.click();

  await new Promise(res => setTimeout(res, delay));
  allDoneHeader = document.querySelector('#all_done_header');
  allDoneHeader.click();

  await new Promise(res => setTimeout(res, delay));
  standardUICheck('Completed', 1, 0);

  await new Promise(res => setTimeout(res, delay));
  allHeader = document.querySelector('#all_header');
  allHeader.click();
  standardUICheck('All Todos', 1, 1);

  await new Promise(res => setTimeout(res, delay));
  deleteAllVisible();

  await new Promise(res => setTimeout(res, delay));
  alert('Done Testing');
})();