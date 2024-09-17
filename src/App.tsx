import { CalendarDate } from "@internationalized/date";

import { campgroundAvailability } from "./data/campgroundAvailability";

import { GridRow } from "./GridRow";

function App() {
  const rows = Object.keys(campgroundAvailability);

  return (
    <div className="p-10">
      <h1 className="mb-10 text-2xl font-bold">Grid experiments</h1>

      <table className="border-collapse border-spacing-0">
        <tbody>
          {rows.map((siteId) => {
            return (
              <GridRow
                key={siteId}
                startDate={new CalendarDate(2024, 9, 1)}
                days={20}
                siteId={siteId}
                siteName={campgroundAvailability[siteId].site}
                siteAvailabilities={
                  campgroundAvailability[siteId].availabilities
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
