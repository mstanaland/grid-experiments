import {
  type CalendarDate,
  DateDuration,
  isSameDay,
  maxDate,
  minDate,
  toCalendarDate,
} from "@internationalized/date";
import { useCallback, useMemo, useRef, useState } from "react";
import { RangeValue } from "./types/AvailabilityGridState.types";
import { constrainValue, previousAvailableDate, checkValidity } from "./utils";

// type FacilityAvailability = Record<
//   string,
//   {
//     site: string;
//     availabilities: Record<string, string>;
//   }
// >;

export type SiteAvailabilities = Record<string, string>;

export interface AvailabilityGridRowStateOptions {
  value?: RangeValue<CalendarDate>;
  defaultValue?: RangeValue<CalendarDate>;
  onChange?: (value: RangeValue<CalendarDate> | null) => void;
  visibleStartDate: CalendarDate;
  visibleDuration?: DateDuration;
  minValue?: CalendarDate;
  maxValue?: CalendarDate;
  allowsNonContiguousRanges?: boolean;
  siteAvailabilities: SiteAvailabilities; // "2024-09-01": "Available"
  isInvalid?: boolean;
  isDisabled?: boolean;
}

export function useAvailabilityGridRowState(
  props: AvailabilityGridRowStateOptions,
) {
  const {
    value: valueProp,
    defaultValue,
    onChange,
    visibleDuration = { days: 10 },
    minValue,
    maxValue,
    visibleStartDate,
    siteAvailabilities,
    isInvalid,
  } = props;

  const [interactionStartDate, setInteractionStartDate] =
    useState<CalendarDate | null>(null);
  const [interactionEndDate, setInteractionEndDate] =
    useState<CalendarDate | null>(null);
  const [anchorDate, setAnchorDateState] = useState<CalendarDate | null>(null);
  const [focusedDate, setFocusedDate] = useState<CalendarDate | null>(null);
  const [isFocused, setFocused] = useState(false);
  const [isDragging, setDragging] = useState(false);

  const [value, setValue] = useState<RangeValue<CalendarDate> | null>(
    valueProp ?? defaultValue ?? null,
  );

  const visibleEndDate = visibleStartDate.add(visibleDuration);

  // Available range must be stored in a ref so we have access to the updated version immediately in `isInvalid`.
  const availableRangeRef = useRef<Partial<RangeValue<CalendarDate>> | null>(
    null,
  );
  const [availableRange, setAvailableRange] = useState<Partial<
    RangeValue<CalendarDate>
  > | null>(null);
  const min = useMemo(
    () => maxDate(minValue, availableRange?.start),
    [minValue, availableRange],
  );
  const max = useMemo(
    () => minDate(maxValue, availableRange?.end),
    [maxValue, availableRange],
  );

  const isDateUnavailable = useCallback(
    (date: CalendarDate) => {
      // if (min && min.compare(date) < 0) {
      //   return true;
      // }
      // if (max && max.compare(date) > 0) {
      //   return true;
      // }
      const dateKey = date.toString();
      return siteAvailabilities[dateKey] !== "Available";
    },
    [siteAvailabilities],
  );

  const updateAvailableRange = (date: CalendarDate | null) => {
    if (date && !props.allowsNonContiguousRanges) {
      const nextAvailableStartDate = nextUnavailableDate(
        date,
        visibleStartDate,
        visibleEndDate,
        isDateUnavailable,
        -1,
      );
      const nextAvailableEndDate = nextUnavailableDate(
        date,
        visibleStartDate,
        visibleEndDate,
        isDateUnavailable,
        1,
      );
      availableRangeRef.current = {
        start: nextAvailableStartDate,
        end: nextAvailableEndDate,
      };
      setAvailableRange(availableRangeRef.current);
    } else {
      availableRangeRef.current = null;
      setAvailableRange(null);
    }
  };

  const setAnchorDate = (date: CalendarDate | null) => {
    if (date) {
      setAnchorDateState(date);
      updateAvailableRange(date);
    } else {
      setAnchorDateState(null);
      updateAvailableRange(null);
    }
  };

  const highlightedRange = anchorDate
    ? makeRange(anchorDate, focusedDate)
    : value && makeRange(value.start, value.end);

  const selectDate = (date: CalendarDate) => {
    const constrainedDate = constrainValue(date, min, max);
    const previousAvailableConstrainedDate = previousAvailableDate(
      constrainedDate,
      visibleStartDate,
      isDateUnavailable,
    );

    if (!previousAvailableConstrainedDate) {
      return;
    }

    if (!anchorDate) {
      setAnchorDate(previousAvailableConstrainedDate);
    } else {
      const range = makeRange(anchorDate, previousAvailableConstrainedDate);
      if (range) {
        setValue({
          start: range.start,
          end: range.end,
        });

        if (onChange) {
          onChange({
            start: range.start,
            end: range.end,
          });
        }
      }
      setAnchorDate(null);
    }
  };

  const deselectDates = () => {
    if (!highlightedRange?.start && !highlightedRange?.end) {
      return;
    }

    setAnchorDate(null);
    setValue(null);
    if (onChange) {
      onChange(null);
    }
  };

  // Sets focus to a specific cell date
  function focusCell(date: CalendarDate) {
    date = constrainValue(date, minValue, maxValue);
    setFocusedDate(date);
  }

  const isInvalidSelection = useMemo(() => {
    if (!value || anchorDate) {
      return false;
    }

    if (
      isDateUnavailable &&
      (isDateUnavailable(value.start) || isDateUnavailable(value.end))
    ) {
      return true;
    }

    return (
      checkValidity(value.start, minValue, maxValue) ||
      checkValidity(value.end, minValue, maxValue)
    );
  }, [isDateUnavailable, value, anchorDate, minValue, maxValue]);

  const isValueInvalid = isInvalid || isInvalidSelection;

  return {
    anchorDate,
    setAnchorDate,
    selectDate,
    deselectDates,
    highlightedRange,
    value,
    isDragging,
    setDragging,
    isValueInvalid,
    isDateUnavailable,
    interactionStartDate,
    setInteractionStartDate,
    interactionEndDate,
    setInteractionEndDate,
    selectFocusedDate() {
      if (focusedDate) {
        selectDate(focusedDate);
      }
    },
    highlightDate: (date: CalendarDate) => {
      if (anchorDate) {
        setFocusedDate(date);
      }
    },
    // isSelected: (date: CalendarDate) => {
    //   return Boolean(
    //     highlightedRange &&
    //       date.compare(highlightedRange.start) >= 0 &&
    //       date.compare(highlightedRange.end) <= 0 &&
    //       !isDateUnavailable(date),
    //   );
    // },
    isSelected(date: CalendarDate) {
      return Boolean(
        highlightedRange &&
          date.compare(highlightedRange.start) >= 0 &&
          date.compare(highlightedRange.end) <= 0 &&
          !this.isCellDisabled(date) &&
          !this.isDateUnavailable(date),
      );
    },
    getAvailability: (date: CalendarDate) => {
      return siteAvailabilities[date.toString()];
    },
    isCellFocused(date: CalendarDate) {
      return isFocused && focusedDate && isSameDay(date, focusedDate);
    },
    setFocusedDate(date: CalendarDate) {
      focusCell(date);
      setFocused(true);
    },
    isInvalid(date: CalendarDate) {
      return checkValidity(
        date,
        availableRangeRef.current?.start,
        availableRangeRef.current?.end,
      );
    },
    isCellDisabled(date: CalendarDate) {
      return (
        props.isDisabled ||
        date.compare(visibleStartDate) < 0 ||
        date.compare(visibleEndDate) > 0 ||
        this.isInvalid(date)
      );
    },
    distance: highlightedRange
      ? highlightedRange.end.compare(highlightedRange.start)
      : 0,
  };
}

// function isDateUnavailable(
//   date: CalendarDate,
//   siteAvailabilities: SiteAvailabilities,
// ) {
//   const dateKey = date.toString();
//   return Boolean(siteAvailabilities[dateKey]);
// }

function makeRange(
  start: CalendarDate,
  end: CalendarDate | null,
): RangeValue<CalendarDate> | null {
  if (!start || !end) {
    return null;
  }

  if (end.compare(start) < 0) {
    [start, end] = [end, start];
  }

  return { start: toCalendarDate(start), end: toCalendarDate(end) };
}

function nextUnavailableDate(
  anchorDate: CalendarDate,
  visibleStart: CalendarDate,
  visibleEnd: CalendarDate,
  isDateUnavailable: (date: CalendarDate) => boolean,
  dir: number,
): CalendarDate | undefined {
  let nextDate = anchorDate.add({ days: dir });
  while (
    (dir < 0
      ? nextDate.compare(visibleStart) >= 0
      : nextDate.compare(visibleEnd) <= 0) &&
    !isDateUnavailable(nextDate)
  ) {
    nextDate = nextDate.add({ days: dir });
  }

  if (isDateUnavailable(nextDate)) {
    return nextDate.add({ days: -dir });
  }
}

export type AvailabilityGridState = ReturnType<
  typeof useAvailabilityGridRowState
>;
