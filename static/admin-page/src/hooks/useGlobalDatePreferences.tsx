import { useCallback, useEffect, useState } from "react";
import { PreferredDateFields } from "../common/types";
import { START_AND_END_FIELDS_STORAGE_KEY } from "../common/constants";
import { invoke } from "@forge/bridge";

export default function useGlobalDatePreferences(): [
  PreferredDateFields | undefined,
  (value: PreferredDateFields) => void
] {
  const [globalDatePreferences, setGlobalDatePreferences] = useState<
    PreferredDateFields | undefined
  >(undefined);

  const loadGlobalDatePreferences = useCallback(async () => {
    const loadedGlobalDatePreferences = await invoke<
      PreferredDateFields | undefined
    >("loadData", {
      key: START_AND_END_FIELDS_STORAGE_KEY,
    });
    setGlobalDatePreferences(loadedGlobalDatePreferences);
  }, []);

  useEffect(() => {
    loadGlobalDatePreferences();
  }, [loadGlobalDatePreferences]);

  function updateGlobalDatePreferences(
    updatedPreferredDateFields: PreferredDateFields
  ) {
    setGlobalDatePreferences(updatedPreferredDateFields);
    invoke("saveData", {
      key: START_AND_END_FIELDS_STORAGE_KEY,
      value: updatedPreferredDateFields,
    });
  }

  return [globalDatePreferences, updateGlobalDatePreferences];
}
