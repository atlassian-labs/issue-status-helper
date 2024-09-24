import { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import Spinner from "@atlaskit/spinner";
import { Stack } from "@atlaskit/primitives";
import { ProjectPreferences } from "../common/types";
import Toggle from "@atlaskit/toggle";
import { Label } from "@atlaskit/form";

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
          childMinMaxDatesEnabled: false,
          shrinkParentEnabled: false,
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

  const {
    commentsEnabled = true,
    sprintDatesEnabled = false,
    childMinMaxDatesEnabled = false,
    shrinkParentEnabled = false,
  } = projectPreferences;

  return (
    <Stack space="space.150">
      <Stack space="space.025">
        <Label htmlFor="commentsEnabledToggle">Comment on issues</Label>
        <Toggle
          id="commentsEnabledToggle"
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
      </Stack>
      <Stack space="space.025">
        <Label htmlFor="sprintDatesEnabledToggle">
          Assign dates from sprints
        </Label>
        <Toggle
          id="sprintDatesEnabledToggle"
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
      </Stack>

      <Stack space="space.025">
        <Label htmlFor="childMinMaxDatesEnabledToggle">
          Parent issues inherit earliest start date and latest end date from
          children
        </Label>
        <Toggle
          isChecked={childMinMaxDatesEnabled}
          onChange={() =>
            onToggle({
              key: "childMinMaxDatesEnabled",
              enabled: !childMinMaxDatesEnabled,
            })
          }
          label={`Enable start and end date inheritance`}
          name="dateInheritance"
        />
      </Stack>
      <Stack space="space.025">
        <Label htmlFor="shrinkParentEnabledToggle">
          Parent issues inherit earliest end date even if some children have no
          end date
        </Label>
        <Toggle
          isChecked={shrinkParentEnabled}
          onChange={() =>
            onToggle({
              key: "shrinkParentEnabled",
              enabled: !shrinkParentEnabled,
            })
          }
          label={`Enable start and end date inheritance`}
          name="dateInheritanceShrink"
        />
      </Stack>
    </Stack>
  );
};
