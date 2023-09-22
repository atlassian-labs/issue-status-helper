import { ChangeLogItem } from "./types";

export const statusChangelogItems: ChangeLogItem[] = [
  {
    field: "status",
    fieldtype: "jira",
    fieldId: "status",
    from: "10000",
    fromString: "To Do",
    to: "3",
    toString: "In Progress",
  },
];

export const sprintChangelogItems: ChangeLogItem[] = [
  {
    field: "Sprint",
    fieldtype: "custom",
    fieldId: "customfield_10020",
    from: "126",
    fromString: null,
    to: "127",
    toString: null,
  },
];

export const teamManagedParentChangelogItems: ChangeLogItem[] = [
  {
    field: "IssueParentAssociation",
    fieldtype: "jira",
    from: null,
    fromString: null,
    to: "14614",
    toString: null,
  },
];

export const companyManagedParentChangelogItems: ChangeLogItem[] = [
  {
    field: "Epic Link",
    fieldtype: "custom",
    fieldId: "customfield_10014",
    from: null,
    fromString: null,
    to: "14647",
    toString: null,
  },
];

export const higherLevelParentChangelogItems: ChangeLogItem[] = [
  {
    field: "Parent Link",
    fieldtype: "custom",
    fieldId: "customfield_10018",
    from: null,
    fromString: null,
    to: null,
    toString: "BAM-3",
  },
];
