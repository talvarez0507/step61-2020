const CLIENT_ID =
    '499747085593-hvi6n4kdrbbfvcuo1c9a9tu9oaf62cr2.apps.googleusercontent.com';

var API_KEY; 

// Constants for discovery documents' URLs. 
const DISCOVERY_DOCS_CALENDAR =
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

const DISCOVERY_DOCS_SHEETS =
    'https://sheets.googleapis.com/$discovery/rest?version=v4';

const DISCOVERY_DOCS_TASKS =
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest';

// Scopes for API access
const SCOPE_CALENDAR_READ_ONLY = 'https://www.googleapis.com/auth/calendar.readonly';
const SCOPE_CALENDAR_READ_WRITE = 'https://www.googleapis.com/auth/calendar';
const SCOPE_SHEETS_READ_WRITE = 'https://www.googleapis.com/auth/spreadsheets';
const SCOPE_TASKS_READ_ONLY = 'https://www.googleapis.com/auth/tasks.readonly';

// Object for all error codes
const ERROR_CODES = {
  popup_closed_by_user: 'popup_closed_by_user',
  access_denied: 'access_denied'
}; 

/** Calls the API key servlet to retrieve the key. */
function fetchApiKey() {
  fetch('./appConfigServlet')
      .then((response) => {
        const responseJson = response.json()
        API_KEY = responseJson['API_KEY'];  
      }); 
}

/**
 * If current use is signed in and authorized,
 * for read-only access to any of the APIs, 
 * hide the log-in button and show log-out button for that API.
 * Otherwise, the user needs to log in and/or authorize. 
 */
function handleApiButtons() {
  const $logInCalendarButton = $('#calendar-auth-button');
  const $logOutCalendarButton = $('#calendar-logout-button');
  const $exportSheetsButton = $('#sheets-export-button'); 
  const $connectTasksButton = $('#connect-tasks-btn'); 
  

  var currentAuth = gapi.auth2.getAuthInstance(); 

  if (currentAuth && currentAuth.isSignedIn.get()) {
    currentUser = currentAuth.currentUser.get(); 
    if (currentUser.hasGrantedScopes(SCOPE_CALENDAR_READ_ONLY) ||
        currentUser.hasGrantedScopes(SCOPE_CALENDAR_READ_WRITE)){
      $logInCalendarButton.addClass('d-none');
      $logOutCalendarButton.removeClass('d-none');
      $('#import-calendar-button').removeClass('d-none');
      $('#export-calendar-button').removeClass('d-none');
    } else {
      $logInCalendarButton.removeClass('d-none');
      $logOutCalendarButton.addClass('d-none'); 
      $('#import-calendar-button').addClass('d-none');
      $('#export-calendar-button').addClass('d-none');
    }
      
    if (currentUser.hasGrantedScopes(SCOPE_SHEETS_READ_WRITE)) {
      $exportSheetsButton.removeClass('d-none'); 
    } else {
      $exportSheetsButton.addClass('d-none');
    }

    if (currentUser.hasGrantedScopes(SCOPE_TASKS_READ_ONLY)) {
      $connectTasksButton.removeClass('d-none');
    } else {
      $connectTasksButton.addClass('d-none');
    }
    
  } 
}

function logOutAllApis() {
  const $calendarView = $('#calendar-view');
  const $logInCalendarButton = $('#calendar-auth-button');
  const $logOutCalendarButton = $('#calendar-logout-button');
  const $exportSheetsButton = $('#sheets-export-button'); 
  const $connectTasksButton = $('#connect-tasks-btn'); 
  const $importCalendarButton = $('#import-calendar-button');

  $calendarView.addClass('d-none');
  $logInCalendarButton.removeClass('d-none');
  $logOutCalendarButton.addClass('d-none');
  $('#export-calendar-button').addClass('d-none'); 
  $exportSheetsButton.addClass('d-none');
  $connectTasksButton.addClass('d-none'); 
  $importCalendarButton.addClass('d-none'); 
  $('#import-menu-wrapper').addClass('d-none');

  gapi.auth2.getAuthInstance().signOut();
}