import {
  type SiteAvailabilities,
  useAvailabilityGridRowState,
} from "./useAvailabilityGridRowState";
import { GridCell } from "./GridCell";
import { useAvailabilityGridRow } from "./useAvailabilityGridRow";
import { AvailabilityGridState } from "./useAvailabilityGridState";

interface GridRowProps {
  gridState: AvailabilityGridState;
  rowIndex: number;
  siteAvailabilities: SiteAvailabilities;
  siteId: string;
  siteName: string;
}

export function GridRow({
  gridState,
  rowIndex,
  siteAvailabilities,
  siteId,
  siteName,
}: GridRowProps) {
  const rowState = useAvailabilityGridRowState({
    gridState,
    rowIndex,
    siteAvailabilities,
  });

  const { columns, rowProps } = useAvailabilityGridRow({
    rowState,
    gridState,
  });

  return (
    <tr {...rowProps} className="border-0">
      <td className="border-0 pr-4 text-right">{siteName}</td>
      {columns.map((item) => {
        return (
          <GridCell
            key={item.key}
            state={rowState}
            siteId={siteId}
            date={item.date}
          />
        );
      })}
    </tr>
  );
}
