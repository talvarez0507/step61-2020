package com.google.sps.data;

import java.time.Duration;

/** Models a task. It can be used for both creation and import flow. */
public final class Task {

  private final String name;
  private final String description;
  private final Duration durationMinute;
  private final Integer priority;

  // TODO(raulcruise): Add an ID field if necessary.

  public Task(String name, String description, Duration durationMinute, Integer priority) {
    if (durationMinute == null) {
      throw new IllegalArgumentException("Task needs a duration");
    }

    this.name = name;
    this.description = description;
    this.durationMinute = durationMinute;
    this.priority = priority;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public Duration getDurationMinute() {
    return durationMinute;
  }

  public Integer getPriority() {
    return priority;
  }
}
