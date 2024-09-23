import { CalendarDate, parseDate } from "@internationalized/date";
import * as React from "react";

interface AvailabilityGridContext {
  focusedRow: number;
  setFocusedRow: React.Dispatch<React.SetStateAction<number>>;
  focusedDate: CalendarDate | null;
  setFocusedDate: React.Dispatch<React.SetStateAction<CalendarDate | null>>;
}

export const AvailabilityGridContext =
  React.createContext<AvailabilityGridContext | null>(null);

interface AvailabilityGridProviderProps {
  children: React.ReactNode;
  startDate: string;
}

export function AvailabilityGridProvider({
  children,
  startDate,
}: AvailabilityGridProviderProps) {
  const [focusedRow, setFocusedRow] = React.useState(0);
  const [focusedDate, setFocusedDate] = React.useState<CalendarDate | null>(
    parseDate(startDate),
  );

  const value = React.useMemo(() => {
    return { focusedRow, setFocusedRow, focusedDate, setFocusedDate };
  }, [focusedDate, focusedRow]);

  return (
    <AvailabilityGridContext.Provider value={value}>
      {children}
    </AvailabilityGridContext.Provider>
  );
}
