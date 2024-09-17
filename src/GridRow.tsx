import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  type SiteAvailabilities,
  useAvailabilityGridRowState,
} from "./useAvailabilityGridRowState";
import { GridCell } from "./GridCell";
import { useRef } from "react";
import { useEvent } from "./utils";

interface GridRowProps {
  siteAvailabilities: SiteAvailabilities;
  siteId: string;
  siteName: string;
  startDate?: CalendarDate;
  days?: number;
}

export function GridRow({
  siteAvailabilities,
  siteId,
  siteName,
  startDate: startDateProp,
  days = 10,
}: GridRowProps) {
  const timeZone = getLocalTimeZone();
  const visibleStartDate = startDateProp ?? today(timeZone);
  const isVirtualClick = useRef(false);
  const windowRef = useRef(typeof window !== "undefined" ? window : null);
  const ref = useRef<HTMLTableRowElement>(null);
  const state = useAvailabilityGridRowState({
    visibleStartDate,
    siteAvailabilities,
    visibleDuration: { days },
  });

  // Stop range selection when pressing or releasing a pointer outside the calendar body,
  // except when pressing the next or previous buttons to switch months.
  const endDragging = (e: PointerEvent) => {
    if (isVirtualClick.current) {
      isVirtualClick.current = false;
      return;
    }

    state.setDragging(false);
    if (!state.anchorDate) {
      return;
    }

    const target = e.target as Element;
    if (
      !ref.current?.contains(target) ||
      !target.closest('button, [role="button"]')
    ) {
      state.selectFocusedDate();
    }
  };

  useEvent(windowRef, "pointerup", endDragging);

  const columns = [...new Array(days).keys()].map((index) => {
    const date = visibleStartDate.add({ days: index });
    const key = date.toString();

    return {
      key,
      date,
    };
  });

  return (
    <tr ref={ref} className="border-0">
      <td className="border-0 pr-4 text-right">{siteName}</td>
      {columns.map((item) => {
        return (
          <GridCell
            key={item.key}
            state={state}
            siteId={siteId}
            date={item.date}
          />
        );
      })}
    </tr>
  );
}
