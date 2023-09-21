import { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import Spinner from "@atlaskit/spinner";
import { Inline, Stack } from "@atlaskit/primitives";
import { ProjectPreferences } from "../common/types";
import Toggle from "@atlaskit/toggle";

type ProjectConfigProps = {
  storageKey: string;
};

type OnToggle = (args: {
  key: keyof ProjectPreferences;
  enabled: boolean;
}) => void;

export const ProjectConfig = (props: ProjectConfigProps) => {
  const [projectPreferences, setProjectPreferences] = useState<
    ProjectPreferences | undefined
  >(undefined);

  const { storageKey } = props;

  useEffect(() => {
    setProjectPreferences(undefined);
    invoke("loadData", {
      key: storageKey,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const loadedProjectPreferences: ProjectPreferences = response;

      // @ts-ignore - Need to trust the data
      if (loadedProjectPreferences === undefined) {
        // No data has been stored yet, no action
        setProjectPreferences({
          commentsEnabled: true,
          sprintDatesEnabled: false,
        });
      } else {
        setProjectPreferences(loadedProjectPreferences);
      }
    });
  }, [storageKey]);

  if (projectPreferences === undefined) {
    return <Spinner />;
  }

  const onToggle: OnToggle = ({ key, enabled }) => {
    const updatedProjectPreferences: ProjectPreferences = {
      ...projectPreferences,
      [key]: enabled,
    };

    setProjectPreferences(updatedProjectPreferences);
    invoke("saveData", {
      key: storageKey,
      value: updatedProjectPreferences,
    });
  };

  const { commentsEnabled = true, sprintDatesEnabled = false } =
    projectPreferences;

  return (
    <Stack space="space.100">
      <Inline space="space.100" alignBlock="center">
        <span>Comment on issues</span>
        <Toggle
          isChecked={commentsEnabled}
          onChange={() =>
            onToggle({
              key: "commentsEnabled",
              enabled: !commentsEnabled,
            })
          }
          label={`Enable comments`}
          name="comments"
        />
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <span>Assign dates from sprints</span>
        <Toggle
          isChecked={sprintDatesEnabled}
          onChange={() =>
            onToggle({
              key: "sprintDatesEnabled",
              enabled: !sprintDatesEnabled,
            })
          }
          label={`Enable sprint dates`}
          name="sprintDates"
        />
      </Inline>
    </Stack>
  );
};
