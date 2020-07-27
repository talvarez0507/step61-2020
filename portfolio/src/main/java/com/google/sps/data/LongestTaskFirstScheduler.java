package com.google.sps.data;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

public class LongestTaskFirstScheduler implements TaskScheduler {

  // Comparator for sorting tasks by duration in ascending order
  public static final Comparator<Task> sortByTaskDurationAscending =
      Comparator.comparing(Task::getDuration);

  /**
   * Schedules the tasks so that the longest tasks are scheduled to the first possible free time
   * range of the day. This approach tries to prioritize long tasks so that they are scheduled.
   */
  public Collection<ScheduledTask> schedule(
      Collection<CalendarEvent> events,
      Collection<Task> tasks,
      Instant workHoursStartTime,
      Instant workHoursEndTime) {

    List<CalendarEvent> eventsList = new ArrayList<CalendarEvent>(events);
    List<Task> tasksList = new ArrayList<Task>(tasks);

    // Sorts the tasks in descending order based on duration.
    // Longest task comes first in the collection.
    // Then sorts the list again by alphabetical order ascending.
    Collections.sort(
        tasksList,
        Collections.reverseOrder(sortByTaskDurationAscending).thenComparing(Task::getName));

    CalendarEventsGroup calendarEventsGroup =
        new CalendarEventsGroup(eventsList, workHoursStartTime, workHoursEndTime);
    List<TimeRange> availableTimes = calendarEventsGroup.getFreeTimeRanges();
    Collections.sort(
        availableTimes, TimeRange.SORT_BY_TIME_RANGE_DURATION_ASCENDING_THEN_START_TIME);

    // Create a TimeRangeGroup class for the free time ranges.
    TimeRangeGroup availableTimesGroup = new ArrayListTimeRangeGroup(availableTimes);

    List<ScheduledTask> scheduledTasks = new ArrayList<ScheduledTask>();

    boolean requiresTaskSplitUp = true;

    for (Task task : tasksList) {
      Duration taskDuration = task.getDuration();

      // Find the first free time range that is longer than the current task's duration.
      for (TimeRange currentFreeTimeRange : availableTimes) {
        if (currentFreeTimeRange.duration().compareTo(taskDuration) >= 0) {
          // Construct the scheduled task based on the start time of this current time range.
          Instant scheduledTime = currentFreeTimeRange.start();
          ScheduledTask scheduledTask = new ScheduledTask(task, scheduledTime);
          scheduledTasks.add(scheduledTask);

          // Delete the amount of time that is scheduled for this task from
          // the original free time range.
          TimeRange scheduledTimeRange =
              TimeRange.fromStartEnd(scheduledTime, scheduledTime.plus(taskDuration));
          availableTimesGroup.deleteTimeRange(scheduledTimeRange);
          availableTimes =
              (ArrayList<TimeRange>) reconstructAvailableTimeRanges(availableTimesGroup);

          // Break out of the inner for loop, as the current task
          // is scheduled and the outer loops needs to move to the next task.
          requiresTaskSplitUp = false;
          break;
        }
      }

      // If at this point the requiresTaskSplitUp variable is still true, then
      // there isn't any individual free time range that is long enough for the current task.
      // At this point, the availableTimes also hasn't been modified based on the current task.
      // Run the logic on splitting up the task into smaller chunks.

      // If the total duration of available free times is longer than the task's duration,
      // then this task can be split up into smaller blocks to be scheduled.
      // Otherwise, there is not enough free time in the day for this task, so this
      // task will not be scheduled.
      if (requiresTaskSplitUp
          && availableTimesGroup.getTotalDuration().compareTo(taskDuration) > 0) {

        while (taskDuration.getSeconds() > 0 && !availableTimes.isEmpty()) {
          // System.out.println(task.getName());
          // System.out.println(taskDuration.toMinutes());

          // The first time range in availableTimes is the shortest free time range.
          TimeRange currentFreeTimeRange = availableTimes.get(0);
          Instant scheduledTime = currentFreeTimeRange.start();
          ScheduledTask scheduledTask = new ScheduledTask(task, scheduledTime);
          scheduledTasks.add(scheduledTask);

          // If task's current duration is longer than the free time's,
          // this means the entirety of the free time range is scheduled to this task.
          if (taskDuration.compareTo(currentFreeTimeRange.duration()) > 0) {
            availableTimesGroup.deleteTimeRange(currentFreeTimeRange);
            taskDuration = taskDuration.minus(currentFreeTimeRange.duration());
          } else {
            // Otherwise, only part of the free time range is scheduled to this task.
            Instant scheduledTaskEndTime = scheduledTime.plus(taskDuration);
            TimeRange scheduledTaskTimeRange =
                TimeRange.fromStartEnd(scheduledTime, scheduledTaskEndTime);
            availableTimesGroup.deleteTimeRange(scheduledTaskTimeRange);
            taskDuration = taskDuration.minus(scheduledTaskTimeRange.duration());
          }

          availableTimes = reconstructAvailableTimeRanges(availableTimesGroup);
        }
      }
    }

    return scheduledTasks;
  }

  /** Returns the scheduler's type, which is Longest Task First. */
  public SchedulingAlgorithmType getSchedulingAlgorithmType() {
    return SchedulingAlgorithmType.LONGEST_TASK_FIRST;
  }

  /** Reconstructs a list for the updated available time ranges after deletion. */
  private List<TimeRange> reconstructAvailableTimeRanges(TimeRangeGroup updatedTimeRangeGroup) {
    Iterator<TimeRange> updatedAvailableTimesGroupIterator = updatedTimeRangeGroup.iterator();

    List<TimeRange> updatedAvailableTimes = new ArrayList();
    while (updatedAvailableTimesGroupIterator.hasNext()) {
      updatedAvailableTimes.add(updatedAvailableTimesGroupIterator.next());
    }

    Collections.sort(
        updatedAvailableTimes, TimeRange.SORT_BY_TIME_RANGE_DURATION_ASCENDING_THEN_START_TIME);
    return updatedAvailableTimes;
  }
}
