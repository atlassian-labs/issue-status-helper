import { useEffect, useState } from "react";
import { requestJira } from "@forge/bridge";
import { Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import { OnDateFieldSelected } from "../types";
import { SelectDateField } from "./SelectDateField";
import {
  CustomField,
  PreferredDateFields,
  ProjectPreferences,
} from "../common/types";
import Toggle from "@atlaskit/toggle";
import { Label } from "@atlaskit/form";
import useProjectPreferences from "../hooks/useProjectPreferences";
import useGlobalDatePreferences from "../hooks/useGlobalDatePreferences";

type ProjectStartAndEndFieldProps = {
  projectId: string;
};

export const ProjectStartAndEndFields = (
  props: ProjectStartAndEndFieldProps
) => {
  const { projectId } = props;
  const [dateFields, setDateFields] = useState<CustomField[] | undefined>();
  const [projectPreferences, updateProjectPreferences] =
    useProjectPreferences(projectId);
  const [globalDatePreferences] = useGlobalDatePreferences(projectId);

  useEffect(() => {
    requestJira("/rest/api/3/field/search?query=date")
      .then((response) => response.json())
      .then((responseBody) => {
        const customFields = responseBody.values as CustomField[];
        const dateFields = customFields
          .filter((customField) => customField.schema?.type === "date")
          .sort((a, b) => a.name.localeCompare(b.name));
        setDateFields(dateFields);
      });
  }, []);

  const onDateFieldSelected: OnDateFieldSelected = ({
    dateFieldId,
    dateFieldType,
  }) => {
    const preference =
      dateFieldType === "START" ? "startFieldId" : "endFieldId";
    const updatedProjectPreferences: ProjectPreferences = {
      ...projectPreferences,
      [preference]: dateFieldId,
    };

    updateProjectPreferences(updatedProjectPreferences);
  };

  const onSupportedChange = (isEnabled: boolean) => {
    const updatedProjectPreferences: ProjectPreferences = {
      ...projectPreferences,
      dateFieldsEnabled: isEnabled,
    };

    updateProjectPreferences(updatedProjectPreferences);
  };

  if (
    projectPreferences === undefined ||
    dateFields === undefined ||
    globalDatePreferences === undefined
  ) {
    return <Spinner />;
  }

  const { dateFieldsEnabled, startFieldId, endFieldId } = projectPreferences;
  const preferredDateFields: PreferredDateFields = {
    START: startFieldId,
    END: endFieldId,
  };

  let enabled = dateFieldsEnabled;
  if (dateFieldsEnabled === undefined) {
    enabled = globalDatePreferences.enabled;
  }

  return (
    <Stack space="space.200">
      <Stack>
        <Label htmlFor="Enabled">Update date fields</Label>
        <Toggle
          id="Enabled"
          isChecked={enabled}
          onChange={() => onSupportedChange(!enabled)}
          value="Enabled"
          name="enabledDateFields"
        />
      </Stack>
      <SelectDateField
        dateFieldType="START"
        id="start"
        label="Start field to set"
        dateFields={dateFields}
        preferredDateFields={preferredDateFields}
        onDateFieldSelected={onDateFieldSelected}
        offerDefaultOption={true}
      />
      <SelectDateField
        dateFieldType="END"
        id="end"
        label="End field to set"
        dateFields={dateFields}
        preferredDateFields={preferredDateFields}
        onDateFieldSelected={onDateFieldSelected}
        offerDefaultOption={true}
      />
    </Stack>
  );
};
