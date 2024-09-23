import { useEffect, useRef, useState } from "react";
import { isSameDay, type CalendarDate } from "@internationalized/date";
import { mergeProps, usePress } from "react-aria";

import type { AvailabilityGridRowState } from "./useAvailabilityGridRowState";

export interface AvailabilityGridCellProps {
  /** The date that this cell represents. */
  date: CalendarDate;
  siteId: string;
  isDisabled?: boolean;
}

export function useAvailabilityGridCell(
  props: AvailabilityGridCellProps,
  state: AvailabilityGridRowState,
  ref: React.RefObject<HTMLElement | null>,
) {
  const { date } = props;

  let isSelected = state.isSelected(date);

  const isCellFocused = state.isCellFocused(date);
  const availability = state.getAvailability(date);
  const isUnavailable = state.isDateUnavailable(date);
  const isDisabled = props.isDisabled || state.isCellDisabled(date);
  const isSelectable = !isDisabled && !isUnavailable;
  const isInvalid =
    state.isValueInvalid &&
    !state.anchorDate &&
    state.highlightedRange &&
    date.compare(state.highlightedRange.start) >= 0 &&
    date.compare(state.highlightedRange.end) <= 0;

  if (isInvalid) {
    isSelected = true;
  }

  const isStartOfRange =
    state.highlightedRange?.start &&
    isSameDay(date, state.highlightedRange.start);

  const isMiddleOfRange =
    state.highlightedRange?.start &&
    state.highlightedRange?.end &&
    date.compare(state.highlightedRange.start) > 0 &&
    date.compare(state.highlightedRange.end) < 0;

  const isEndOfRange =
    state.highlightedRange?.end && isSameDay(date, state.highlightedRange.end);

  const isAnchorPressed = useRef(false);
  const isRangeBoundaryPressed = useRef(false);
  const touchDragTimerRef = useRef<number | undefined>();

  useEffect(() => {
    if (ref.current && isCellFocused) {
      ref.current?.focus();
    }
  }, [isCellFocused, ref]);

  let tabIndex: number | undefined = undefined;
  if (!isDisabled && state.focusedDate) {
    tabIndex =
      state.isRowFocused && isSameDay(date, state.focusedDate) ? 0 : -1;
  }

  const closeButtonPress = usePress({
    onPress: state.deselectDates,
  });

  const { pressProps, isPressed } = usePress({
    // When dragging to select a range, we don't want dragging over the original anchor
    // again to trigger onPressStart. Cancel presses immediately when the pointer exits.
    shouldCancelOnPointerExit: "anchorDate" in state && !!state.anchorDate,
    preventFocusOnPress: true,
    isDisabled: !isSelectable,
    onPressStart(e) {
      if (
        !state.anchorDate &&
        (e.pointerType === "mouse" || e.pointerType === "touch")
      ) {
        // Allow dragging the start or end date of a range to modify it
        // rather than starting a new selection.
        // Don't allow dragging when invalid, or weird jumping behavior may occur as date ranges
        // are constrained to available dates. The user will need to select a new range in this case.
        if (state.highlightedRange && !isInvalid) {
          if (isSameDay(date, state.highlightedRange.start)) {
            state.setAnchorDate(state.highlightedRange.end);
            state.setFocusedDate(date);
            // state.setDragging(true);
            isRangeBoundaryPressed.current = true;
            return;
          } else if (isSameDay(date, state.highlightedRange.end)) {
            state.setAnchorDate(state.highlightedRange.start);
            state.setFocusedDate(date);
            // state.setDragging(true);
            isRangeBoundaryPressed.current = true;
            return;
          }
        }

        const startDragging = () => {
          state.setDragging(true);
          touchDragTimerRef.current = undefined;

          state.selectDate(date);
          state.setFocusedDate(date);
          isAnchorPressed.current = true;
        };

        // Start selection on mouse/touch down so users can drag to select a range.
        // On touch, delay dragging to determine if the user really meant to scroll.
        if (e.pointerType === "touch") {
          touchDragTimerRef.current = setTimeout(startDragging, 200);
        } else {
          startDragging();
        }
      }
    },
    onPressEnd() {
      isRangeBoundaryPressed.current = false;
      isAnchorPressed.current = false;
      clearTimeout(touchDragTimerRef.current);
      touchDragTimerRef.current = undefined;
    },
    onPressUp(event) {
      state.setInteractionEndDate(date);
      // If the user tapped quickly, the date won't be selected yet and the
      // timer will still be in progress. In this case, select the date on touch up.
      // Timer is cleared in onPressEnd.
      if (touchDragTimerRef.current) {
        state.selectDate(date);
        state.setFocusedDate(date);
      }

      if (
        state.value &&
        !state.anchorDate &&
        isSameDay(date, state.value.end)
      ) {
        // setInteractionStartDate(null);
        state.deselectDates();
        return;
      } else if (isRangeBoundaryPressed.current) {
        // When clicking on the start or end date of an already selected range,
        // start a new selection on press up to also allow dragging the date to
        // change the existing range.
        state.setAnchorDate(date);
      } else if (state.anchorDate && !isAnchorPressed.current) {
        // When releasing a drag or pressing the end date of a range, select it.
        state.selectDate(date);
        state.setFocusedDate(date);
      } else if (event.pointerType === "keyboard" && !state.anchorDate) {
        // For range selection, auto-advance the focused date by one if using keyboard.
        // This gives an indication that you're selecting a range rather than a single date.
        // For mouse, this is unnecessary because users will see the indication on hover. For screen readers,
        // there will be an announcement to "click to finish selecting range" (above).
        state.selectDate(date);
        let nextDay = date.add({ days: 1 });
        if (state.isInvalid(nextDay)) {
          nextDay = date.subtract({ days: 1 });
        }
        if (!state.isInvalid(nextDay)) {
          state.setFocusedDate(nextDay);
        }
      } else if (event.pointerType === "virtual") {
        // For screen readers, just select the date on click.
        state.selectDate(date);
        state.setFocusedDate(date);
      }
    },
  });

  return {
    cellProps: {
      role: "gridcell",
      "aria-disabled": !isSelectable || undefined,
      "aria-selected": undefined,
      "aria-invalid": isInvalid || undefined,
    },
    buttonProps: mergeProps(pressProps, {
      tabIndex,
      role: "button",
      "aria-disabled": isDisabled,
      "aria-label": undefined,
      "aria-invalid": undefined,
      "data-grid-cell": true,
      onPointerEnter(event: PointerEvent) {
        // Highlight the date on hover or drag over a date when selecting a range.
        if (
          (event.pointerType !== "touch" || state.isDragging) &&
          isSelectable
        ) {
          state.highlightDate(date);
        }
      },
      onPointerDown(event: PointerEvent) {
        // This is necessary on touch devices to allow dragging
        // outside the original pressed element.
        // (JSDOM does not support this)
        const target = event.target as HTMLElement | null;
        if (target && "releasePointerCapture" in target) {
          target?.releasePointerCapture(event.pointerId);
        }
      },
      onContextMenu(event: PointerEvent) {
        // Prevent context menu on long press.
        event.preventDefault();
      },
    }),
    closeButtonProps: closeButtonPress.pressProps,
    isSelected,
    isPressed,
    availability,
    isUnavailable,
    isDisabled,
    isStartOfRange,
    isMiddleOfRange,
    isEndOfRange,
  };
}
