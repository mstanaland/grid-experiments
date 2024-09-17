import * as React from "react";
import cx from "clsx";
import {
  XMarkIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  CheckIcon,
} from "@heroicons/react/16/solid";

import { isSameDay, type CalendarDate } from "@internationalized/date";

import { useAvailabilityGridCell } from "./useAvailabilityGridCell";

import { type AvailabilityGridState } from "./useAvailabilityGridRowState";

interface GridCellProps {
  state: AvailabilityGridState;
  date: CalendarDate;
  siteId: string;
}

export function GridCell({ state, date, siteId }: GridCellProps) {
  const ref = React.useRef(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    availability,
    isUnavailable,
    isDisabled,
  } = useAvailabilityGridCell({ date, siteId }, state);

  const isEndOfRange =
    !state.isDragging &&
    !state.anchorDate &&
    state.value?.end &&
    state.highlightedRange?.end &&
    isSameDay(date, state.value.end);

  const isStart =
    state.highlightedRange?.start &&
    isSameDay(date, state.highlightedRange.start);
  const isEnd =
    state.highlightedRange?.end && isSameDay(date, state.highlightedRange.end);
  const isMiddle =
    state.highlightedRange?.start &&
    state.highlightedRange?.end &&
    date.compare(state.highlightedRange.start) > 0 &&
    date.compare(state.highlightedRange.end) < 0;
  const isSelecting = Boolean(state.anchorDate);
  const isSelectingStart =
    state.anchorDate &&
    state.highlightedRange &&
    state.anchorDate?.compare(state.highlightedRange.start) > 0;
  const isSelectingEnd =
    state.anchorDate &&
    state.highlightedRange &&
    state.anchorDate?.compare(state.highlightedRange.end) < 0;

  console.log({ isSelectingStart, isSelectingEnd });

  return (
    <td {...cellProps} className="relative bg-white p-0">
      <div
        {...buttonProps}
        ref={ref}
        className={cx(
          "flex size-12 items-center justify-center border border-white p-1 transition-colors",
          {
            "bg-slate-50 text-slate-400": isUnavailable || isDisabled,
            "bg-blue-100 text-blue-800": !isUnavailable && !isDisabled,
          },
        )}
      >
        <div
          className={cx(
            "absolute flex h-8 items-center justify-center",
            isStart && isEnd
              ? "left-2 w-8 rounded-md"
              : isStart
                ? "left-2 w-12 rounded-l-md border-l"
                : isMiddle
                  ? "w-12"
                  : isEnd
                    ? "right-2 w-10 rounded-r-md border-r"
                    : "w-12 rounded-none",
            {
              "border-y text-white": isSelected,
              "border-blue-600/40 bg-blue-500/70":
                isSelected && state.anchorDate,
              "border-green-700 bg-green-600 transition-colors":
                isSelected && !state.anchorDate,
            },
          )}
        >
          {isStart && isEnd && !isSelecting ? (
            <CheckIcon className="size-6 opacity-60" />
          ) : isStart && isEnd && isSelecting ? (
            <ChevronDoubleRightIcon className="size-6 opacity-60" />
          ) : isStart && !isSelecting ? (
            <CheckIcon className="relative -left-1 size-6 opacity-60" />
          ) : isStart && isSelecting ? (
            <ChevronDoubleRightIcon className="relative -left-1 size-6 opacity-60" />
          ) : isEnd && !isSelecting ? (
            <CheckIcon className="relative size-6 opacity-60" />
          ) : isEnd && isSelecting ? (
            <ChevronDoubleLeftIcon className="relative size-6 opacity-60" />
          ) : isMiddle ? (
            ""
          ) : availability === "Available" ? (
            "A"
          ) : (
            ""
          )}
        </div>
      </div>

      {(isSelectingEnd && isEnd) || (isSelecting && isStart && isEnd) ? (
        <div
          className={cx(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-xs leading-none text-white shadow-sm",
            state.distance >= 4 ? "white right-11 top-4" : "-top-3 right-2",
          )}
        >
          Choose end date
        </div>
      ) : isSelectingStart && isStart ? (
        <div
          className={cx(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-xs leading-none text-white shadow-sm",
            state.distance >= 4 ? "white left-11 top-4" : "-top-3 left-2",
          )}
        >
          Choose start date
        </div>
      ) : null}

      <button
        onClick={state.deselectDates}
        className={cx(
          "absolute -right-2 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-solid border-white bg-red-500 leading-none text-white shadow-sm transition-all",
          isEndOfRange
            ? "visible scale-100 opacity-100"
            : "invisible scale-0 opacity-0",
        )}
      >
        <XMarkIcon className="size-4" />
      </button>
    </td>
  );
}
