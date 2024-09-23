import { campgroundAvailability } from "./data/campgroundAvailability";

import { GridRow } from "./GridRow";
import { useAvailabilityGridState } from "./useAvailabilityGridState";

function App() {
  const rows = Object.keys(campgroundAvailability);
  const gridState = useAvailabilityGridState({
    numRows: rows.length,
    startDate: "2024-09-01",
    days: 20,
  });

  return (
    <div className="p-10">
      <h1 className="mb-10 text-2xl font-bold">Grid experiments</h1>

      <div className="my-10">
        <button>Start</button>
      </div>

      <table
        className="border-collapse border-spacing-0"
        tabIndex={-1}
        onFocus={(event) => {
          const target = event.target as Element;
          if (target.hasAttribute("data-grid-cell")) {
            gridState.setFocused(true);
          }
        }}
        onBlur={(event) => {
          const target = event.target as Element;
          if (!target.hasAttribute("data-grid-cell")) {
            gridState.setFocused(false);
          }
        }}
      >
        <tbody>
          {rows.map((siteId, index) => {
            // @ts-expect-error types TBD
            const currentItem = campgroundAvailability[siteId];

            const { siteName, availabilities } = currentItem;

            return (
              <GridRow
                key={siteId}
                rowIndex={index}
                gridState={gridState}
                siteId={siteId}
                siteName={siteName}
                siteAvailabilities={availabilities}
              />
            );
          })}
        </tbody>
      </table>

      <div className="my-10">
        <button>End</button>
      </div>
    </div>
  );
}

export default App;
