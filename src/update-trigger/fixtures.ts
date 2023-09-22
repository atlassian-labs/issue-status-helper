import { ChangeLogItem, Sprint } from "./types";

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

export const closedSprint: Sprint = {
  id: 1,
  name: "Sprint 1",
  originBoardId: 1,
  self: "self",
  state: "closed",
  completeDate: "1995-12-24T03:24:00",
  endDate: "1995-12-17T03:24:00",
  startDate: "1995-12-10T03:24:00",
  goal: "Pass tests",
};

export const activeSprint: Sprint = {
  id: 1,
  name: "Sprint 1",
  originBoardId: 1,
  self: "self",
  state: "active",
  completeDate: "1995-12-24T03:24:00",
  endDate: "1995-12-17T03:24:00",
  startDate: "1995-12-10T03:24:00",
  goal: "Pass tests",
};

export const activeSprintWithoutDates: Sprint = {
  id: 1,
  name: "Sprint 1",
  originBoardId: 1,
  self: "self",
  state: "active",
  goal: "Pass tests",
};
