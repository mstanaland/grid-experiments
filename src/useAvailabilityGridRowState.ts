import {
  type CalendarDate,
  isSameDay,
  maxDate,
  minDate,
} from "@internationalized/date";
import { useCallback, useMemo, useRef, useState } from "react";
import { RangeValue } from "./types/AvailabilityGrid.types";
import {
  constrainValue,
  previousAvailableDate,
  checkValidity,
  nextUnavailableDate,
  makeRange,
} from "./utils";
import { type AvailabilityGridState } from "./useAvailabilityGridState";

export type SiteAvailabilities = Record<string, string>;

export interface AvailabilityGridRowStateOptions {
  gridState: AvailabilityGridState;
  rowIndex: number;
  value?: RangeValue<CalendarDate>;
  defaultValue?: RangeValue<CalendarDate>;
  onChange?: (value: RangeValue<CalendarDate> | null) => void;
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
    gridState,
    rowIndex,
    value: valueProp,
    defaultValue,
    onChange,
    minValue,
    maxValue,
    siteAvailabilities,
    isInvalid,
  } = props;
  const [interactionStartDate, setInteractionStartDate] =
    useState<CalendarDate | null>(null);
  const [interactionEndDate, setInteractionEndDate] =
    useState<CalendarDate | null>(null);
  const [anchorDate, setAnchorDateState] = useState<CalendarDate | null>(null);

  const [isDragging, setDragging] = useState(false);

  const [value, setValue] = useState<RangeValue<CalendarDate> | null>(
    valueProp ?? defaultValue ?? null,
  );

  const isDateUnavailable = useCallback(
    (date: CalendarDate) => {
      const dateKey = date.toString();
      return siteAvailabilities[dateKey] !== "Available";
    },
    [siteAvailabilities],
  );

  const { focusedDate, setFocusedDate } = gridState;

  // const [focusedDate, setFocusedDate] = useState<CalendarDate | null>(
  //   gridState.visibleStartDate,
  // );

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

  const updateAvailableRange = (date: CalendarDate | null) => {
    if (date && !props.allowsNonContiguousRanges) {
      const nextAvailableStartDate = nextUnavailableDate(
        date,
        gridState.visibleStartDate,
        gridState.visibleEndDate,
        isDateUnavailable,
        -1,
      );
      const nextAvailableEndDate = nextUnavailableDate(
        date,
        gridState.visibleStartDate,
        gridState.visibleEndDate,
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
      gridState.visibleStartDate,
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

  if (focusedDate && checkValidity(focusedDate, min, max)) {
    // If the focused date was moved to an invalid value, it can't be focused, so constrain it.
    setFocusedDate(constrainValue(focusedDate, min, max));
  }

  // Sets focus to a specific cell date
  function focusCell(date: CalendarDate) {
    date = constrainValue(date, min, max);
    setFocusedDate(date);
    gridState.setFocused(true);
    gridState.setFocusedRow(rowIndex);
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
      checkValidity(value.start, min, max) || checkValidity(value.end, min, max)
    );
  }, [isDateUnavailable, value, anchorDate, min, max]);

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
    focusedDate,
    setFocused: gridState.setFocused,
    rowIndex,
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
    isRowFocused: gridState.focusedRow === rowIndex,
    isCellFocused(date: CalendarDate) {
      return (
        gridState.isFocused &&
        this.isRowFocused &&
        focusedDate &&
        isSameDay(date, focusedDate)
      );
    },
    setFocusedDate(date: CalendarDate | null) {
      if (date) {
        focusCell(date);
      } else {
        gridState.setFocusedDate(null);
      }
    },
    focusNextDay() {
      if (focusedDate) {
        focusCell(focusedDate.add({ days: 1 }));
      }
    },
    focusPreviousDay() {
      if (focusedDate) {
        focusCell(focusedDate.subtract({ days: 1 }));
      }
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
        date.compare(gridState.visibleStartDate) < 0 ||
        date.compare(gridState.visibleEndDate) > 0 ||
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

export type AvailabilityGridRowState = ReturnType<
  typeof useAvailabilityGridRowState
>;
