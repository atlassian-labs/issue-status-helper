import { Label } from "@atlaskit/form";
import Select from "@atlaskit/select";
import {
  IssueStatus,
  IssueStatusCategoryName,
  PreferredStatuses,
} from "../common/types";
import { OnStatusSelected, StatusOption } from "../types";
import { Stack } from "@atlaskit/primitives";

type SelectStatusProps = {
  id: string;
  label: string;
  onStatusSelected: OnStatusSelected;
  statuses: IssueStatus[];
  preferredStatuses: PreferredStatuses;
  categoryName: IssueStatusCategoryName;
  offerDefaultOption?: boolean;
};

type CreateStatusOptions = (args: {
  statuses: IssueStatus[];
  categoryName: IssueStatusCategoryName;
  offerDefaultOption: boolean;
}) => StatusOption[];

const createStatusOptions: CreateStatusOptions = ({
  statuses,
  categoryName,
  offerDefaultOption,
}) => {
  const statusOptions = statuses
    .filter((status) => status.statusCategory.name === categoryName)
    .map((status) => {
      const label = `${status.name} (id: ${status.id})`;
      return { label, value: status.id };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  statusOptions.unshift({ label: "No transition", value: "-1" });
  if (offerDefaultOption === true) {
    statusOptions.unshift({ label: "Use default ", value: "-2" });
  }
  return statusOptions;
};

export const SelectStatus = (props: SelectStatusProps) => {
  const {
    categoryName,
    id,
    label,
    onStatusSelected,
    preferredStatuses,
    statuses,
    offerDefaultOption = false,
  } = props;

  const value = preferredStatuses[categoryName];
  const options = createStatusOptions({
    statuses,
    categoryName,
    offerDefaultOption,
  });
  let initiallySelectedOption = options.find(
    (option) => option.value === value
  );

  if (initiallySelectedOption === undefined && options.length > 0) {
    initiallySelectedOption = options[0];
  }

  const onChange = (selectedOption: StatusOption) => {
    console.log("Selected", selectedOption);
    onStatusSelected({
      statusId: selectedOption.value,
      category: categoryName,
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
