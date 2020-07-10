/**
 * Models the requests sent to the algorithm for scheduling. This class is
 * useful when the request information needs to be sent to the scheduling
 * servlet through a POST request. This class contains all the request
 * information that can be easily converted into a JSON string.
 */
class ScheduleRequest {
  /**
   * All fields are required for this object.
   * @param events: events happening the day of the scheduling. This is an
   *     array of JavaScript CalendarEvent objects.
   * @param tasks: the tasks a user would like to schedule on that day. This is
   *     an array of JavaScript Task objects.
   * @param startTime: a JavaScript Date object representing the start time.
   * @param endTime: a JavaScript Date object representing the end time.
   * @param algorithmType: a string representation of the algorithm type that
   *     the user can select fromt the UI.
   */
  constructor(events, tasks, startTime, endTime, algorithmType) {
    this.events = events;
    this.tasks = tasks;
    this.startTime = startTime;
    this.endTime = endTime;
    this.algorithmType = algorithmType;
  }
}

// Once a call is made to the server for scheduling this array will be a local
// copy of the results.
var scheduledTasks = []

    /**
     * Gets all of the scheduling information from the UI and returns a
     * ScheduleRequest with all of the data.
     */
    function
    createRequestFromUiInformation() {
      const startTime = document.getElementById('working-hour-start').value;
      const endTime = document.getElementById('working-hour-end').value;
      const events = collectAllEvents();
      const tasks = collectAllTasks();
      const algorithmType = document.getElementById('algorithm-type').value;
      const scheduleRequest = new ScheduleRequest(
          events, tasks, getTimeObject(startTime), getTimeObject(endTime),
          algorithmType);
      return scheduleRequest;
    }

/**
 * Gets called when the user hits 'Start Scheduling'.
 */
function
startScheduling() {
  const scheduleRequest = createRequestFromUiInformation();
  // Create the request to send to the server using the data we collected from
  // the web form.
  fetchScheduledTasksFromServlet(scheduleRequest).then((scheduledTaskArray) => {
    updateResultsOnPage(scheduledTaskArray);
  });
}

/**
 * Updates the UI to show the results of a query.
 */
function updateResultsOnPage(scheduledTaskArray) {
  const resultElement = document.getElementById('scheduled-task-list');
  resultElement.innerHTML = '';
  scheduledTaskArray.forEach(addScheduledTaskToPage, resultElement);
}

/**
 * Handles sending the ScheduleRequest object to the servlet and returns the
 * scheduled tasks.
 */
function
fetchScheduledTasksFromServlet() {
  const scheduleRequest = createRequestFromUiInformation();
  const json = JSON.stringify(scheduleRequest);
  return fetch('/schedule', {method: 'POST', body: json})
      .then((response) => {
        // This is still a Promise.
        return response.json();
      })
      // Turns result from a Promise into its Array value.
      .then((array) => {
        scheduledTasks = array;
        return scheduledTasks;
      });
}

/**
 * Returns the local copy of the latest scheduled tasks.
 */
function
collectAllScheduledTasks() {
  return scheduledTasks;
}

/**
 * This takes in a single JSON object of a ScheduledTask (Java Class) and
 * displays that information on the result element using a card format.
 */
function addScheduledTaskToPage(scheduledTaskWrapper, resultElement) {
  const task = scheduledTaskWrapper.task;
  const taskName = task.name;
  const taskTimeSeconds = scheduledTaskWrapper.startTime.seconds;
  const taskDate = new Date();
  // This is x1000 because the functions takes milliseconds
  taskDate.setTime(taskTimeSeconds * 1000);
  const taskPriority = task.priority.priority;
  resultElement.innerText += taskName;

  const newResultCard = document.createElement('div');
  newResultCard.classList.add('card');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  newResultCard.appendChild(cardBody);

  const cardTitle = document.createElement('h4');
  cardTitle.classList.add('card-title');
  cardTitle.innerText = taskName;
  cardBody.appendChild(cardTitle);

  const timeText = document.createElement('p');
  timeText.classList.add('card-text');
  timeText.innerText = 'Scheduled for: ' + taskDate;
  cardBody.appendChild(timeText);

  const eventList = document.getElementById('scheduled-task-list');
  eventList.innterHTML = '';
  eventList.appendChild(newResultCard);
}
