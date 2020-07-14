var GoogleAuth;

// Scope for read access to Tasks API
const SCOPE_TASKS_READ = 'https://www.googleapis.com/auth/tasks.readonly';

const TASKS_CLIENT_ID =
    '499747085593-hvi6n4kdrbbfvcuo1c9a9tu9oaf62cr2.apps.googleusercontent.com';

const TASKS_DISCOVERY_DOCS =
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest';

var TASKS_API_KEY = '';

function fetchApiKey() {
  fetch('./appConfigServlet')
      .then(response => response.json())
      .then((responseJson) => {
        TASKS_API_KEY = responseJson['API_KEY'];
      });
}

function handleClientLoadTasks() {
  // Load the API's client and auth2 modules.
  // Call the initClient function after the modules load.
  gapi.load('client:auth2', initClientTasks);
}

function initClientTasks() {
  fetchApiKey();

  // Initialize the gapi.client object, which app uses to make API requests.
  // Get API key and client ID from API Console.
  // 'scope' field specifies space-delimited list of access scopes.
  gapi.client
      .init({
        apiKey: TASKS_API_KEY,
        clientId: TASKS_CLIENT_ID,
        discoveryDocs: [TASKS_DISCOVERY_DOCS],
        scope: SCOPE_TASKS_READ
      })
      .then(function() {
        GoogleAuth = gapi.auth2.getAuthInstance();

        // Listen for sign-in state changes.
        GoogleAuth.isSignedIn.listen(updateSigninStatus);

        // Handle initial sign-in state. (Determine if user is already signed
        // in.)
        updateSigninStatus(GoogleAuth.isSignedIn.get());
      });
}

function handleAuthClick() {
  clearAuthErrorPrompt();
  if (GoogleAuth.isSignedIn.get()) {
    // User is authorized and has clicked "Sign out" button.
    GoogleAuth.signOut();
  } else {
    // User is not signed in. Start Google auth flow.
    GoogleAuth.signIn().catch(error => {
      handleTaskAuthError(error);
    });
  }
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    drawImportMenu();
  } else {
    clearImportMenu();
  }
  updateButtonText(isSignedIn);
}

/**
 * Iterate through all the user's tasklists and pass
 * them to updateTaskList().
 */
function importAllTasks() {
  if (GoogleAuth.isSignedIn.get()) {
    gapi.client.tasks.tasklists.list({maxResults: 100})
        .then(function(response) {
          var taskLists = response.result.items;

          // Check that the variable exists so that no error is thrown.
          if (taskLists) {
            taskLists.forEach(tasklist => {
              importTasklist(tasklist.id);
            });
          }
        });
  }
}

/** Import a single tasklist identified by its id. */
function importTasklist(tasklistId) {
  gapi.client.tasks.tasks
      .list({tasklist: tasklistId, maxResults: 100, showCompleted: false})
      .then(function(taskResponse) {
        var tasks = taskResponse.result.items;
        if (tasks) {
          tasks.forEach(task => {
            const newTask = new Task(task.title, task.notes, '60', '3');
            updateTaskList(newTask, TIME_UNIT.MINUTES);
          });
        }
      });
}

/**
 * Populate the import-menu-wrapper div with an import menu when the user is
 * logged in.
 */
function drawImportMenu() {
  // Create a div element to hold the custom select.
  const customSelect = document.getElementById('import-menu-wrapper');

  // Create the select part of the custom select.
  const tasklistSelect = document.createElement('select');
  tasklistSelect.classList.add('custom-select');
  tasklistSelect.setAttribute('id', 'import-select');
  var option = tasklistSelect.appendChild(document.createElement('option'));
  option.innerText = 'All Tasklists';

  // Add all Tasklists of user to the select.
  gapi.client.tasks.tasklists.list({maxResults: 30}).then(function(response) {
    var tasklists = response.result.items;
    if (tasklists) {
      tasklists.forEach(tasklist => {
        option = tasklistSelect.appendChild(document.createElement('option'));
        option.setAttribute('value', tasklist.id);
        option.innerText = tasklist.title;
      });
    }
  });

  // Append the select to the div holding our input group.
  customSelect.appendChild(tasklistSelect);

  // Create the button part of the custom select that will be appended
  // to the input group.
  const inputGroupAppend = document.createElement('div');
  inputGroupAppend.classList.add('input-group-append');

  const importButton = document.createElement('button');
  importButton.classList.add('btn', 'btn-outline-secondary');
  importButton.setAttribute('type', 'button');
  importButton.setAttribute('onclick', 'handleImportButtonPress()');
  importButton.innerText = 'Import';

  inputGroupAppend.appendChild(importButton);
  customSelect.appendChild(inputGroupAppend);
}

function clearImportMenu() {
  const menuWrapper = document.getElementById('import-menu-wrapper');
  menuWrapper.innerHTML = '';
}

function updateButtonText(isSignedIn) {
  const button = document.getElementById('connect-tasks-btn');
  if (isSignedIn) {
    button.innerText = 'Unlink Tasks';
  } else {
    button.innerText = 'Link Tasks';
  }
}

function handleImportButtonPress() {
  const choice = document.getElementById('import-select').value;
  if (choice == 'All Tasklists') {
    importAllTasks();
  } else {
    importTasklist(choice);
  }
}

function clearTasks() {
  const toClear = document.getElementById('new-task-list');
  toClear.innerHTML = '';
}

function handleTaskAuthError(e) {
  if (e.error == 'popup_closed_by_user') {
    $('#task-link-error')
        .text(
            'Please complete the entire sign in process if you wish to import Tasks.');
  } else if (e.error == 'access_denied') {
    $('#task-link-error')
        .text(
            'You have denied this app from accessing your tasks,' +
            'please allow access if you wish to import tasks.');
  } else {
    $('#task-link-error')
        .text(
            'Unknown error encountered when granting permissions. Please try again.');
  }

  $('#task-link-error').addClass('d-block');
}

function clearAuthErrorPrompt() {
  $('#task-link-error').text('');
  $('#task-link-error').removeClass('d-block');
}
