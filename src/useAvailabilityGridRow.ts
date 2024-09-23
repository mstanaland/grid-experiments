import { useRef, useMemo } from "react";
import { type AvailabilityGridRowState } from "./useAvailabilityGridRowState";
import { useEvent } from "./utils";
import { type AvailabilityGridState } from "./useAvailabilityGridState";

interface UseAvailabilityGridRowProps {
  rowState: AvailabilityGridRowState;
  gridState: AvailabilityGridState;
}

export function useAvailabilityGridRow({
  rowState,
  gridState,
}: UseAvailabilityGridRowProps) {
  const isVirtualClick = useRef(false);
  const windowRef = useRef(typeof window !== "undefined" ? window : null);
  const ref = useRef<HTMLTableRowElement>(null);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        event.stopPropagation();
        rowState.focusNextDay();
        break;
      case "ArrowLeft":
        event.preventDefault();
        event.stopPropagation();
        rowState.focusPreviousDay();
        break;
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        gridState.focusNextRow();
        break;
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        gridState.focusPreviousRow();
        break;
      case "Escape":
        // Cancel the selection.
        event.preventDefault();
        rowState.setAnchorDate(null);
        break;
    }
  };

  // Stop range selection when pressing or releasing a pointer outside the calendar body,
  // except when pressing the next or previous buttons to switch months.
  const maybeAbortSelecting = (target: Element) => {
    if (
      (rowState.anchorDate && !ref.current?.contains(target)) ||
      !target.closest('button, [role="button"]')
    ) {
      rowState.setDragging(false);
      rowState.deselectDates();
      rowState.setAnchorDate(null);
    }
  };

  const endDragging = (e: PointerEvent) => {
    rowState.setDragging(false);

    if (isVirtualClick.current) {
      isVirtualClick.current = false;
      return;
    }

    if (!rowState.anchorDate) {
      return;
    }

    const target = e.target as Element;
    maybeAbortSelecting(target);
  };

  useEvent(windowRef, "pointerup", endDragging);
  useEvent(windowRef, "focusin", (event) => {
    const target = event.target as Element;
    maybeAbortSelecting(target);
  });

  const columns = useMemo(() => {
    return [...new Array(gridState.days).keys()].map((index) => {
      const date = gridState.visibleStartDate.add({ days: index });
      const key = `${date.toString()}-${rowState.isRowFocused}`;

      return {
        key,
        date,
      };
    });
  }, [gridState.days, gridState.visibleStartDate, rowState.isRowFocused]);

  return {
    columns,
    rowProps: {
      ref,
      onKeyDown,
    },
  };
}
