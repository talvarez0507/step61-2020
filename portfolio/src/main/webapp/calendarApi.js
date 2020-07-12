var googleAuth;
 
// Scopes for API access to Google Calendar
const SCOPE_CALENDAR_READ_ONLY = 'https://www.googleapis.com/auth/calendar.readonly';
const SCOPE_CALENDAR_READ_WRITE = 'https://www.googleapis.com/auth/calendar';
 
// For the discovery document for Google Calendar API.
const DISCOVERY_URL_CALENDAR =
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
 
// Object for all error codes
const ERROR_CODES = {
  popup_closed_by_user: 'popup_closed_by_user',
  access_denied: 'access_denied'
}; 
 
/**
 * Loads the API's client and auth2 modules.
 * Calls the initCalendarClient function after the modules load.
 */
function initiateCalendarAuth() {
  gapi.load('client:auth2', initCalendarClient);
}
 
/** Starts authentication flow based on current user's login status. */
function initCalendarClient() {
  //console.log("calendar: initCalendarClient");

  // If the user has not logged into their Google account yet, 
  // initializes the gapi.client object, which app uses to make API requests.
  // Initially, the scope is read-only to view user's Google Calendar.
  if (!googleAuth) {
    //console.log("calendar: no user, normal init");
    fetchApiKey();
    
    gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: [DISCOVERY_URL_CALENDAR, DISCOVERY_DOCS_SHEETS],
        scope: SCOPE_CALENDAR_READ_ONLY
      })
      .then(finishCalendarInit());
  } else {
    //console.log("calendar: already auth exists, grant scope");
    // This is the case that the user has logged into their Google account. 
    // Grants the read-only scope of Calendar to the current user. 
    var googleUser = gapi.auth2.getAuthInstance().currentUser.get();
    googleUser.grant({scope: SCOPE_CALENDAR_READ_ONLY})
        .then(finishCalendarInit());
  }
  
}

/** 
 * Runs after the promise is returned from gapi.client.init.
 * Attaches a listener to the signed-in status of the user 
 * that handle all API buttons' display accordingly. 
 */
function finishCalendarInit() {
  googleAuth = gapi.auth2.getAuthInstance();
 
  // Listen for sign-in state changes.
  googleAuth.isSignedIn.listen(handleApiButtons);
  
  // const $logOutButton = $('#calendar-logout-button');
  // $logOutButton.click(handleCalendarSignOut);
  handleCalendarSignIn(); 
}

/** Toggles the visibility of log in/out button based on user's sign-in status. */
function displayCalendarButtons() {
  const $logInButton = $('#calendar-auth-button');
  const $logOutButton = $('#calendar-logout-button');
  if (googleAuth.isSignedIn.get()) {
    $logInButton.addClass('d-none'); 
    $logOutButton.removeClass('d-none');
  } else {
    $logInButton.removeClass('d-none'); 
    $logOutButton.addClass('d-none'); 
  }
}
 
/** Signs user in. */
function handleCalendarSignIn() {
  // User is not signed in. Start Google auth flow.
  googleAuth.signIn()
      .then((response) => {
        var $importCalendarMessage = $('#import-calendar-message');
        $importCalendarMessage.addClass('d-none');
        updateCalendarView(); 
      })
      .catch(function(error) {
        handleImportAuthError(error);
      });
}

/** Signs user out of Google account. */
function handleCalendarSignOut() {
  googleAuth.signOut(); 
}
 
/**
 * Updates import message box based on the error during authentication process
 * for importing.
 */
function handleImportAuthError(e) {
  var $importCalendarMessage = $('#import-calendar-message');
 
  var errorMessage;
  if (e.error === ERROR_CODES.popup_closed_by_user) {
    errorMessage =
        'It seems like you didn\'t complete the authorization process. ' +
        'Please click the Login button again.'
  } else if (e.error === ERROR_CODES.access_denied) {
    errorMessage =
        'You didn\'t give permission to view your Google Calendar, ' +
        'so your calendar events cannot be viewed or imported.'
  } else {
    errorMessage = 'An error occurred.';
  }
  $importCalendarMessage.text(errorMessage).removeClass('d-none');
}
 
/** Disconnects current user authentication. */
function revokeCalendarAccess() {
  googleAuth.disconnect();
}
 
/** Updates the calendar view and button visibility based on login status. */
function updateCalendarView() {
  const googleUser = googleAuth.currentUser.get();
  const isAuthorized = googleUser.hasGrantedScopes(SCOPE_CALENDAR_READ_ONLY);
  if (isAuthorized) {
    showCalendarView(googleUser);
    $('#import-calendar-button').removeClass('d-none');
    $('#export-calendar-button').removeClass('d-none');
  } else {
    $('#import-calendar-button').addClass('d-none');
    $('#export-calendar-button').addClass('d-none');
  }
}

/**
 * Retrieves the logged in user's Google email and uses that email
 * to embed the user's Google Calendar on the UI.
 * The calendar is displayed in the user's Google Calendar's time zone.
 */
function showCalendarView(user) {
  const userEmail = encodeURIComponent(user.getBasicProfile().getEmail());
 
  // Fetches the user's Calendar's time zone.
  gapi.client.calendar.settings.get({setting: 'timezone'})
      .then((responseTimeZone) => {
        const userCalendarTimeZone =
            encodeURIComponent(responseTimeZone.result.value);
        const calendarViewUrl =
            'https://calendar.google.com/calendar/embed?src=' + userEmail +
            '&ctz=' + userCalendarTimeZone + '&mode=WEEK';
 
        // Updates the UI so that calendar view appears.
        $('#calendar-view').attr('src', calendarViewUrl).removeClass('d-none');
      });
}
 
/** Retrives the date that the user has picked for the scheduling. */
function getUserPickedDate() {
  const userPickedDate = $('#date-picker').val().split('-');
  const year = userPickedDate[0];
  const month = userPickedDate[1];
  const date = userPickedDate[2];
 
  const pickedDate = new Date();
  pickedDate.setFullYear(year);
  pickedDate.setMonth(month - 1);  // month is zero-indexed.
  pickedDate.setDate(date);
 
  return pickedDate;
}
 
/**
 * Print the summary and start datetime/date of the events for the
 * day that user has picked in the nav bar.
 * If no events are found a message is displayed on the UI.
 */
function listUpcomingEvents() {
  const timeRangeStart = getUserPickedDate();
  const timeRangeEnd = new Date();
  timeRangeEnd.setFullYear(timeRangeStart.getFullYear());
  timeRangeEnd.setMonth(timeRangeStart.getMonth());
  timeRangeEnd.setDate(timeRangeStart.getDate() + 1);
 
  // Retrieves events on the user's calendar for the day
  // that the user has picked in the nav bar.
  gapi.client.calendar.events
      .list({
        calendarId: 'primary',
        timeMin: timeRangeStart.toISOString(),
        timeMax: timeRangeEnd.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime'
      })
      .then(function(response) {
        var events = response.result.items;
        var $emptyCalendarMessage = $('#empty-calendar-import-message');
 
        // Show message for no imported event if result list is empty.
        if (events.length == 0) {
          const pickedDate = $('#date-picker').val();
          $emptyCalendarMessage.text(
                  'There aren\'t any events scheduled on your Google Calendar for ' +
                  pickedDate)
              .removeClass('d-none');
        } else {
          $emptyCalendarMessage.addClass('d-none');
 
          events.forEach((event) => {
            const eventName = event.summary;
 
            // When retrieved from Google Calendar, these time strings
            // are in the time zone of the user's Calendar's time zone.
            // These time strings have format YYYY-MM-DDTHH:MM:SS-TimeZoneOffset
            var startTimeString = event.start.dateTime;
            if (!startTimeString) {
              startTimeString = event.start.date;
            }
 
            var endTimeString = event.end.dateTime;
            if (!endTimeString) {
              endTimeString = event.end.date;
            }
 
            const newCalendarEvent = new CalendarEvent(
                eventName, new Date(startTimeString), new Date(endTimeString));
 
            // Add these events to the UI under the events list.
            // On the UI, the event times will be displayed in the user's
            // current location's time zone.
            // Each will not get added more than once.
            const allEvents = collectAllEvents();
            const doesEventExist = allEvents.reduce(
                (newEventExists, existingEvent) => newEventExists ||
                    eventsEqual(newCalendarEvent, existingEvent),
                /* initialValue= */ false);
 
            if (!doesEventExist) {
              updateCalendarEventList(newCalendarEvent);
            }
          });
        }
      });
}
 
/**
 * Onclick function for 'Looks good to me, export" button.
 * Asks the user for Write access to the API scope.
 */
function addCalendarWriteScope() {
  var googleUser = googleAuth.currentUser.get();
  googleUser.grant({scope: SCOPE_CALENDAR_READ_WRITE})
      .then((response) => {
        $('#export-calendar-message').addClass('d-none');
        addNewEventsToGoogleCalendar();
      })
      .catch(function(error) {
        handleExportAuthError(error);
      })
}
 
/**
 * Adds the scheduled task items back to the user's Google Calendar.
 * TODO(hollyyuqizheng): fill in the rest of the method once
 * results can be returned from the scheduling algorithm.
 */
function addNewEventsToGoogleCalendar() {
  const event = {};
  addOneEventToGoogleCalendar(event);
}
 
/** Adds an individual event to the authorized user's Google Calendar. */
function addOneEventToGoogleCalendar(event) {
  const request = gapi.client.calendar.events.insert(
      {calendarId: 'primary', resource: event});
 
  request.execute(function() {
    // Refreshes the calendar view so that the new event shows up on it.
    showCalendarView(googleAuth.currentUser.get());
  });
}
 
/**
 * Updates import message box based on the error during authentication process
 * for exporting
 */
function handleExportAuthError(e) {
  var $exportCalendarMessage = $('#export-calendar-message');
 
  var errorMessage;
  if (e.error === ERROR_CODES.popup_closed_by_user) {
    errorMessage =
        'It seems like you didn\'t complete the authorization process. ' +
        'Please click the Export button again.';
  } else if (e.error === ERROR_CODES.access_denied) {
    errorMessage =
        'You didn\'t give permission to update your Google Calendar, ' +
        'so your task schedule cannot be exported.'
  } else {
    errorMessage = 'An error occurred';
  }
 
  $exportCalendarMessage.text(errorMessage).removeClass('d-none');
}
