import { invoke } from "@forge/bridge";
import { useCallback, useEffect, useState } from "react";
import { ProjectPreferences } from "../common/types";
import { generateProjectPreferencesStorageKey } from "../components/ProjectDetails";

export default function useProjectPreferences(
  projectId: string
): [ProjectPreferences | undefined, (value: ProjectPreferences) => void] {
  const [projectPreferences, setProjectPreferences] = useState<
    ProjectPreferences | undefined
  >(undefined);

  const storageKey = generateProjectPreferencesStorageKey({ projectId });
  const loadProjectPreferences = useCallback(async () => {
    const loadedProjectPreferences = await invoke<
      ProjectPreferences | undefined
    >("loadData", {
      key: storageKey,
    });
    if (loadedProjectPreferences === undefined) {
      // No data has been stored yet, no action
      setProjectPreferences({
        commentsEnabled: true,
        sprintDatesEnabled: false,
        childMinMaxDatesEnabled: false,
        shrinkParentEnabled: false,
        startFieldId: "-1",
        endFieldId: "-1",
      });
    } else {
      setProjectPreferences(loadedProjectPreferences);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectPreferences();
  }, [loadProjectPreferences]);

  function updateProjectPrefrences(
    updatedProjectPreferences: ProjectPreferences
  ) {
    setProjectPreferences(updatedProjectPreferences);
    invoke("saveData", {
      key: storageKey,
      value: updatedProjectPreferences,
    });
  }

  return [projectPreferences, updateProjectPrefrences];
}
