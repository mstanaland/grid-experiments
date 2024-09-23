import * as React from "react";
import cx from "clsx";
import {
  XMarkIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  CheckIcon,
} from "@heroicons/react/16/solid";

import { type CalendarDate } from "@internationalized/date";

import { useAvailabilityGridCell } from "./useAvailabilityGridCell";

import { type AvailabilityGridRowState } from "./useAvailabilityGridRowState";
import { mergeProps, useFocusRing } from "react-aria";

interface GridCellProps {
  state: AvailabilityGridRowState;
  date: CalendarDate;
  siteId: string;
}

export function GridCell({ state, date, siteId }: GridCellProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    closeButtonProps,
    isSelected,
    availability,
    isUnavailable,
    isDisabled,
    isEndOfRange,
    isStartOfRange,
    isMiddleOfRange,
  } = useAvailabilityGridCell({ date, siteId }, state, ref);

  const { focusProps, isFocusVisible } = useFocusRing();

  const isSelecting = Boolean(state.anchorDate);

  const isSettledEndOfRange = !isSelecting && isEndOfRange;

  const isSelectingStart =
    state.anchorDate &&
    state.highlightedRange &&
    state.anchorDate?.compare(state.highlightedRange.start) > 0;
  const isSelectingEnd =
    state.anchorDate &&
    state.highlightedRange &&
    state.anchorDate?.compare(state.highlightedRange.end) < 0;

  return (
    <td {...cellProps} className="relative bg-white p-0">
      <div
        {...mergeProps(buttonProps, focusProps)}
        ref={ref}
        className={cx(
          "group flex size-12 items-center justify-center border border-white p-1 outline-none transition-colors",
          isFocusVisible
            ? "group-focus:z-2 ring-2 ring-inset ring-blue-700"
            : "",
          {
            "bg-slate-50 text-slate-400": isUnavailable || isDisabled,
            "bg-blue-100 text-blue-800": !isUnavailable && !isDisabled,
          },
        )}
      >
        <div
          className={cx(
            "absolute flex h-8 items-center justify-center",
            isStartOfRange && isEndOfRange
              ? "left-2 w-8 rounded-md"
              : isStartOfRange
                ? "left-2 w-12 rounded-l-md border-l"
                : isMiddleOfRange
                  ? "w-12"
                  : isEndOfRange
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
          {isStartOfRange && isEndOfRange && !isSelecting ? (
            <CheckIcon className="size-6 opacity-60" />
          ) : isStartOfRange && isEndOfRange && isSelecting ? (
            <ChevronDoubleRightIcon className="size-6 opacity-60" />
          ) : isStartOfRange && !isSelecting ? (
            <CheckIcon className="relative -left-1 size-6 opacity-60" />
          ) : isStartOfRange && isSelecting ? (
            <ChevronDoubleRightIcon className="relative -left-1 size-6 opacity-60" />
          ) : isEndOfRange && !isSelecting ? (
            <CheckIcon className="relative size-6 opacity-60" />
          ) : isEndOfRange && isSelecting ? (
            <ChevronDoubleLeftIcon className="relative size-6 opacity-60" />
          ) : isMiddleOfRange ? (
            ""
          ) : availability === "Available" ? (
            "A"
          ) : (
            ""
          )}
        </div>
      </div>

      {(isSelectingEnd && isEndOfRange) ||
      (isSelecting && isStartOfRange && isEndOfRange) ? (
        <div
          className={cx(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-xs leading-none text-white shadow-sm",
            state.distance >= 4 ? "white right-11 top-4" : "-top-3 right-2",
          )}
        >
          Choose end date
        </div>
      ) : isSelectingStart && isStartOfRange ? (
        <div
          className={cx(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-xs leading-none text-white shadow-sm",
            state.distance >= 4 ? "white left-11 top-4" : "-top-3 left-2",
          )}
        >
          Choose start date
        </div>
      ) : null}

      {isEndOfRange ? (
        <button
          {...closeButtonProps}
          // tabIndex={-1}
          className={cx(
            "absolute -right-2 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-solid border-white bg-red-500 leading-none text-white shadow-sm transition-all",
            isSettledEndOfRange
              ? "visible scale-100 opacity-100"
              : "invisible scale-0 opacity-0",
          )}
        >
          <XMarkIcon className="size-4" />
        </button>
      ) : null}
    </td>
  );
}
