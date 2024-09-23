import {
  CalendarDate,
  maxDate,
  minDate,
  toCalendarDate,
} from "@internationalized/date";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { RangeValue } from "./types/AvailabilityGrid.types";

export interface RefObject<T> {
  current: T;
}

export function makeRange(
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

export function firstAvailableDate(
  visibleStart: CalendarDate,
  visibleEnd: CalendarDate,
  isDateUnavailable: (date: CalendarDate) => boolean,
): CalendarDate | null {
  const diffToEnd = visibleEnd.compare(visibleStart);

  for (let i = 0; i < diffToEnd; i += 1) {
    const dateToCheck = visibleStart.add({ days: i });
    const isUnavailable = isDateUnavailable(dateToCheck);
    if (!isUnavailable) {
      return dateToCheck;
    }
  }

  return null;
}

export function nextUnavailableDate(
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

export function checkValidity(
  date: CalendarDate,
  minValue?: CalendarDate | null,
  maxValue?: CalendarDate | null,
) {
  return (
    (minValue != null && date.compare(minValue) < 0) ||
    (maxValue != null && date.compare(maxValue) > 0)
  );
}

export function constrainValue(
  date: CalendarDate,
  minValue?: CalendarDate | null,
  maxValue?: CalendarDate | null,
) {
  if (minValue) {
    const newDate = maxDate(date, toCalendarDate(minValue));
    if (newDate) {
      date = newDate;
    }
  }

  if (maxValue) {
    const newDate = minDate(date, toCalendarDate(maxValue));
    if (newDate) {
      date = newDate;
    }
  }

  return date;
}

export function previousAvailableDate(
  date: CalendarDate,
  minValue: CalendarDate,
  isDateUnavailable?: (date: CalendarDate) => boolean,
): CalendarDate | null {
  if (!isDateUnavailable) {
    return date;
  }

  while (date.compare(minValue) >= 0 && isDateUnavailable(date)) {
    date = date.subtract({ days: 1 });
  }

  if (date.compare(minValue) >= 0) {
    return date;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function useEffectEvent<T extends Function>(fn?: T): T {
  const ref = useRef<T | null | undefined>(null);
  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);
  // @ts-expect-error just using what was in react-aria
  return useCallback<T>((...args) => {
    const f = ref.current!;
    return f?.(...args);
  }, []);
}

export function useEvent<K extends keyof GlobalEventHandlersEventMap>(
  ref: RefObject<EventTarget | null>,
  event: K | (string & {}),
  handler?: (this: Document, ev: GlobalEventHandlersEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
) {
  const handleEvent = useEffectEvent(handler);
  const isDisabled = handler == null;

  useEffect(() => {
    if (isDisabled || !ref.current) {
      return;
    }

    const element = ref.current;
    element.addEventListener(event, handleEvent as EventListener, options);
    return () => {
      element.removeEventListener(event, handleEvent as EventListener, options);
    };
  }, [ref, event, options, isDisabled, handleEvent]);
}
