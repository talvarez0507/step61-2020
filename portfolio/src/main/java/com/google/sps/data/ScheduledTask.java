package com.google.sps.data;

import java.time.Instant;
import java.util.Optional;

/**
 * This is a wrapper class for scheduled tasks. Includes a Task and the Instant when it is
 * scheduled.
 */
public class ScheduledTask {
  private final Task task;
  private final Instant startTime;
  private Optional<Integer> schedulingCompletenessInt;

  public ScheduledTask(Task task, Instant startTime, Optional<Integer> schedulingCompletenessInt) {
    if (task == null) {
      throw new IllegalArgumentException("Task cannot be null");
    }
    if (startTime == null) {
      throw new IllegalArgumentException("Start time cannot be null");
    }
    this.task = task;
    this.startTime = startTime;
    this.schedulingCompletenessInt = schedulingCompletenessInt;
  }

  public Task getTask() {
    return task;
  }

  public Instant getStartTime() {
    return startTime;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof ScheduledTask && equals(this, (ScheduledTask) other);
  }

  public static boolean equals(ScheduledTask a, ScheduledTask b) {
    return a.task.equals(b.task) && a.startTime.equals(b.startTime);
  }

  public void setCompleteness(Optional<Integer> schedulingCompletenessInt) {
    this.schedulingCompletenessInt = schedulingCompletenessInt;
  }
}
