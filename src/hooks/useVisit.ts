/**
 * Hook to track page visits
 */

import { useEffect } from "react";
import { recordVisit } from "@/services/visitService";

export const useVisit = (page?: string) => {
  useEffect(() => {
    // Record visit when component mounts
    recordVisit(page);
  }, [page]);
};

export default useVisit;
