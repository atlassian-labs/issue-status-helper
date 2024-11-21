import { useEffect, useState } from "react";
import { invoke, requestJira } from "@forge/bridge";
import { Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import { START_AND_END_FIELDS_STORAGE_KEY } from "../common/constants";
import { OnDateFieldSelected } from "../types";
import { SelectDateField } from "./SelectDateField";
import { CustomField, PreferredDateFields } from "../common/types";
import Toggle from "@atlaskit/toggle";
import { Label } from "@atlaskit/form";
import useProjectPreferences from "../hooks/useProjectPreferences";
import useGlobalDatePreferences from "../hooks/useGlobalDatePreferences";

type StartAndEndFieldProps = {
  globalConfig: boolean;
  projectId?: string;
};

export const StartAndEndFields = (props: StartAndEndFieldProps) => {
  const { globalConfig, projectId } = props;
  const [dateFields, setDateFields] = useState<CustomField[] | undefined>();
  const [preferredDateFields, updateGlobalDatePreferences] =
    useGlobalDatePreferences();

  useEffect(() => {
    requestJira("/rest/api/3/field")
      .then((response) => response.json())
      .then((responseBody) => {
        const customFields = responseBody as CustomField[];
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
    const updatedPreferredDateFields: PreferredDateFields = {
      ...(preferredDateFields && preferredDateFields),
      [dateFieldType]: dateFieldId,
    };

    updateGlobalDatePreferences(updatedPreferredDateFields);
  };

  const onSupportedChange = (isEnabled: boolean) => {
    const updatedPreferredDateFields = {
      ...preferredDateFields,
      enabled: isEnabled,
    };

    updateGlobalDatePreferences(updatedPreferredDateFields);
  };

  if (preferredDateFields === undefined || dateFields === undefined) {
    return <Spinner />;
  }

  return (
    <Stack space="space.200">
      <Stack>
        <Label htmlFor="Enabled">Update date fields</Label>
        <Toggle
          id="Enabled"
          isChecked={preferredDateFields.enabled}
          onChange={() => onSupportedChange(!preferredDateFields.enabled)}
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
        offerDefaultOption={!globalConfig}
      />
      <SelectDateField
        dateFieldType="END"
        id="end"
        label="End field to set"
        dateFields={dateFields}
        preferredDateFields={preferredDateFields}
        onDateFieldSelected={onDateFieldSelected}
        offerDefaultOption={!globalConfig}
      />
    </Stack>
  );
};
