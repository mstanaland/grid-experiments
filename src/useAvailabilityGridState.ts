import {
  DateDuration,
  getLocalTimeZone,
  parseDate,
  today,
  type CalendarDate,
} from "@internationalized/date";
import * as React from "react";

interface UseAvailabilityGridStateProps {
  numRows: number;
  startDate?: string;
  days?: number;
}

export function useAvailabilityGridState({
  numRows,
  startDate: startDateProp,
  days = 10,
}: UseAvailabilityGridStateProps) {
  const visibleDuration: DateDuration = { days };
  const [visibleStartDate] = React.useState(
    startDateProp ? parseDate(startDateProp) : today(getLocalTimeZone()),
  );
  const [visibleEndDate] = React.useState(
    visibleStartDate.add(visibleDuration),
  );

  const [isFocused, setFocused] = React.useState(false);

  const [focusedRow, setFocusedRow] = React.useState(0);
  const [focusedDate, setFocusedDate] = React.useState<CalendarDate | null>(
    visibleStartDate,
  );

  const focusNextRow = () => {
    setFocusedRow((prev) => {
      return focusedRow + 1 < numRows ? prev + 1 : prev;
    });
  };
  const focusPreviousRow = () => {
    setFocusedRow((prev) => {
      return focusedRow > 0 ? prev - 1 : prev;
    });
  };

  return {
    isFocused,
    setFocused,
    focusedRow,
    setFocusedRow,
    focusedDate,
    setFocusedDate,
    visibleStartDate,
    visibleEndDate,
    visibleDuration,
    focusNextRow,
    focusPreviousRow,
    days,
  };
}

export type AvailabilityGridState = ReturnType<typeof useAvailabilityGridState>;
