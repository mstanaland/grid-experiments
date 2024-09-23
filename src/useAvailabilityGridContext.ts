import { useContext } from "react";
import { AvailabilityGridContext } from "./AvailabilityGridContext";

export function useAvailabilityGridContext() {
  const currentContext = useContext(AvailabilityGridContext);

  if (!currentContext) {
    throw new Error("Not inside a provider");
  }

  return currentContext;
}
