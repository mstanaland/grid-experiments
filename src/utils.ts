import {
  CalendarDate,
  maxDate,
  minDate,
  toCalendarDate,
} from "@internationalized/date";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export interface RefObject<T> {
  current: T;
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
