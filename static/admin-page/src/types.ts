import { IssueStatus, IssueStatusCategoryName, Project } from "./common/types";

export type { Project } from "./common/types";

export type ProjectIssueType = {
  id: string;
  name: string;
  subtask: boolean;
  statuses: IssueStatus[];
};

export type IssueType = {
  id: string;
  name: string;
  hierarchyLevel: number;
  description: string;
  iconUrl: string;
};

export type UpdateSupportedProject = (args: {
  projectId: string;
  isSupported: boolean;
}) => void;

export type OnStatusSelected = (args: {
  statusId: string;
  category: IssueStatusCategoryName;
}) => void;

export type DateFieldType = "START" | "END";

export type OnDateFieldSelected = (args: {
  dateFieldId: string;
  dateFieldType: DateFieldType;
}) => void;

export type StatusOption = {
  label: string;
  value: string;
};
