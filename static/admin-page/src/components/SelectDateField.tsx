import { Label } from "@atlaskit/form";
import Select from "@atlaskit/select";
import { DateFieldType, OnDateFieldSelected, StatusOption } from "../types";
import { CustomField, PreferredDateFields } from "../common/types";
import { Stack } from "@atlaskit/primitives";

type SelectDateFieldProps = {
  id: string;
  label: string;
  onDateFieldSelected: OnDateFieldSelected;
  dateFields: CustomField[];
  preferredDateFields: PreferredDateFields;
  dateFieldType: DateFieldType;
  offerDefaultOption: boolean;
};

type CreateDateFieldOptions = (args: {
  dateFields: CustomField[];
  offerDefaultOption: boolean;
}) => StatusOption[];

const createDateFieldOptions: CreateDateFieldOptions = ({
  dateFields,
  offerDefaultOption,
}) => {
  const dateFieldOptions = dateFields.map((customField) => {
    const label = `${customField.name}`;
    return { label, value: customField.id };
  });
  if (offerDefaultOption === true) {
    dateFieldOptions.unshift({ label: "Use default ", value: "-1" });
  }
  return dateFieldOptions;
};

export const SelectDateField = (props: SelectDateFieldProps) => {
  const {
    dateFieldType,
    id,
    label,
    onDateFieldSelected,
    preferredDateFields,
    dateFields,
    offerDefaultOption,
  } = props;

  const value = preferredDateFields[dateFieldType];
  const options = createDateFieldOptions({
    dateFields,
    offerDefaultOption,
  });
  let initiallySelectedOption = options.find(
    (option) => option.value === value
  );

  if (initiallySelectedOption === undefined && options.length > 0) {
    initiallySelectedOption = options[0];
  }

  const onChange = (selectedOption: StatusOption) => {
    onDateFieldSelected({
      dateFieldId: selectedOption.value,
      dateFieldType,
    });
  };

  return (
    <Stack>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={initiallySelectedOption}
        inputId={id}
        options={options}
        onChange={(option: any) => onChange(option)}
      ></Select>
    </Stack>
  );
};
