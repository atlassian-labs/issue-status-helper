import { useEffect, useState } from "react";
import { invoke, requestJira } from "@forge/bridge";
import { Inline, Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import { START_AND_END_FIELDS_STORAGE_KEY } from "../common/constants";
import { OnDateFieldSelected } from "../types";
import { SelectDateField } from "./SelectDateField";
import { CustomField, PreferredDateFields } from "../common/types";
import Toggle from "@atlaskit/toggle";
import { Label } from "@atlaskit/form";

type StartAndEndFieldProps = {};

export const StartAndEndFields = (props: StartAndEndFieldProps) => {
  const [dateFields, setDateFields] = useState<CustomField[] | undefined>();
  const [preferredDateFields, setPreferredDateField] = useState<
    PreferredDateFields | undefined
  >();

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

  useEffect(() => {
    invoke("loadData", {
      key: START_AND_END_FIELDS_STORAGE_KEY,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const savedPreferredDateFields: PreferredDateFields = response;

      // @ts-ignore - Need to trust the data
      if (savedPreferredDateFields === undefined) {
        // No data has been stored yet, no action
      } else {
        setPreferredDateField(savedPreferredDateFields);
      }
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

    setPreferredDateField(updatedPreferredDateFields);
    invoke("saveData", {
      key: START_AND_END_FIELDS_STORAGE_KEY,
      value: updatedPreferredDateFields,
    });
  };

  const onSupportedChange = (isEnabled: boolean) => {
    const updatedPreferredDateFields = {
      ...preferredDateFields,
      enabled: isEnabled,
    };

    setPreferredDateField(updatedPreferredDateFields);
    invoke("saveData", {
      key: START_AND_END_FIELDS_STORAGE_KEY,
      value: updatedPreferredDateFields,
    });
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
      />
      <SelectDateField
        dateFieldType="END"
        id="end"
        label="End field to set"
        dateFields={dateFields}
        preferredDateFields={preferredDateFields}
        onDateFieldSelected={onDateFieldSelected}
      />
    </Stack>
  );
};
