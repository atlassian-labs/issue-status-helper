import { describe, expect, test } from "@jest/globals";
import { ChangeLogItem, Sprint } from "../types";
import {
  areAllChildrenDone,
  areAllChildrenToDo,
  areSomeChildrenInProgressOrDone,
  findPreferredStatusId,
  generateProjectIssueTypeStatusesStorageKey,
  generateProjectPreferencesStorageKey,
  getParentChangeLogItem,
  getSprintChangeLogItem,
  getSprintStartAndEndDates,
  shouldProcessIssueUpdate,
} from "../utils";
import {
  activeSprint,
  activeSprintWithoutDates,
  closedSprint,
  companyManagedParentChangelogItems,
  higherLevelParentChangelogItems,
  sprintChangelogItems,
  statusChangelogItems,
  teamManagedParentChangelogItems,
} from "../fixtures";

// PLEASE NOTE: Async tests requiring mocked REST API calls that still need to be tested are:
// getChildIssueStatusCategories -> mock searchWithJql
// findPreferredStatusId -> need to mock storage functions (or break up function)
// transitionIssueWithComment -> to to mock REST calls

describe("shouldProcessIssueUpdate", () => {
  it("should return true for status field changes", () => {
    expect(
      shouldProcessIssueUpdate({ changelogItems: statusChangelogItems })
    ).toBe(true);
  });

  it("should return true for sprint field changes", () => {
    expect(
      shouldProcessIssueUpdate({ changelogItems: sprintChangelogItems })
    ).toBe(true);
  });

  it("should return true for team-managed project parent changes", () => {
    expect(
      shouldProcessIssueUpdate({
        changelogItems: teamManagedParentChangelogItems,
      })
    ).toBe(true);
  });

  it("should return true for company-managed project parent changes", () => {
    expect(
      shouldProcessIssueUpdate({
        changelogItems: companyManagedParentChangelogItems,
      })
    ).toBe(true);
  });

  it("should return true for higher level issue parent changes", () => {
    expect(
      shouldProcessIssueUpdate({
        changelogItems: higherLevelParentChangelogItems,
      })
    ).toBe(true);
  });

  it("should return false for description changes", () => {
    const changelogItems: ChangeLogItem[] = [
      {
        field: "description",
        fieldtype: "jira",
        fieldId: "description",
        from: null,
        fromString: null,
        to: null,
        toString: "Hello world!",
      },
    ];
    expect(shouldProcessIssueUpdate({ changelogItems })).toBe(false);
  });
});

describe("getSprintChangeLogItem", () => {
  it("should return the sprint change log item when sprints are changed", () => {
    expect(
      getSprintChangeLogItem({ changelogItems: sprintChangelogItems })
    ).toBeDefined();
    expect(
      getSprintChangeLogItem({ changelogItems: sprintChangelogItems })
    ).toMatchSnapshot();
  });

  it("should return undefined when no sprints are changed", () => {
    expect(
      getSprintChangeLogItem({ changelogItems: statusChangelogItems })
    ).toBeUndefined();
  });
});

describe("getParentChangeLogItem", () => {
  it("should return the parent change log item when team-managed parents are changed", () => {
    expect(
      getParentChangeLogItem({
        changelogItems: teamManagedParentChangelogItems,
      })
    ).toBeDefined();
    expect(
      getParentChangeLogItem({
        changelogItems: teamManagedParentChangelogItems,
      })
    ).toMatchSnapshot();
  });

  it("should return the parent change log item when company-managed parents are changed", () => {
    expect(
      getParentChangeLogItem({
        changelogItems: companyManagedParentChangelogItems,
      })
    ).toBeDefined();
    expect(
      getParentChangeLogItem({
        changelogItems: companyManagedParentChangelogItems,
      })
    ).toMatchSnapshot();
  });

  it("should return the parent change log item when higher level parents are changed", () => {
    expect(
      getParentChangeLogItem({
        changelogItems: higherLevelParentChangelogItems,
      })
    ).toBeDefined();
    expect(
      getParentChangeLogItem({
        changelogItems: higherLevelParentChangelogItems,
      })
    ).toMatchSnapshot();
  });

  it("should return undefined when no parent has been changed", () => {
    expect(
      getParentChangeLogItem({ changelogItems: sprintChangelogItems })
    ).toBeUndefined();
  });
});

describe("storage key generators", () => {
  it("project preferences should generate correct value", () => {
    expect(generateProjectPreferencesStorageKey({ projectId: "10000" })).toBe(
      "PROJECT:10000-PREFERENCES"
    );
  });

  it("project preferences should generate correct value", () => {
    expect(
      generateProjectIssueTypeStatusesStorageKey({
        projectId: "10000",
        issueTypeId: "10002",
      })
    ).toBe("PROJECT:10000-ISSUETYPE:10002");
  });
});

describe("areAllChildrenToDo", () => {
  it("no children means to do", () => {
    expect(areAllChildrenToDo({ childStatusCategories: [] })).toBe(true);
  });

  it("returns true when all are TODO", () => {
    expect(
      areAllChildrenToDo({ childStatusCategories: ["To Do", "To Do", "To Do"] })
    ).toBe(true);
  });

  it("returns false when other statuses are detected", () => {
    expect(
      areAllChildrenToDo({
        childStatusCategories: ["To Do", "Done", "In Progress"],
      })
    ).toBe(false);
  });
});

describe("areSomeChildrenInProgressOrDone", () => {
  it("no children means NOT in progress", () => {
    expect(areSomeChildrenInProgressOrDone({ childStatusCategories: [] })).toBe(
      false
    );
  });
  it("returns true when at least one issue is DONE", () => {
    expect(
      areSomeChildrenInProgressOrDone({
        childStatusCategories: ["To Do", "To Do", "Done"],
      })
    ).toBe(true);
  });
  it("returns true when at least one issue is IN PROGRESS", () => {
    expect(
      areSomeChildrenInProgressOrDone({
        childStatusCategories: ["To Do", "To Do", "In Progress"],
      })
    ).toBe(true);
  });

  it("returns false when other statuses are detected", () => {
    expect(
      areSomeChildrenInProgressOrDone({
        childStatusCategories: ["To Do", "To Do"],
      })
    ).toBe(false);
  });
});

describe("areAllChildrenDone", () => {
  it("no children means NOT done", () => {
    expect(areAllChildrenDone({ childStatusCategories: [] })).toBe(false);
  });
  it("returns true when all are DONE", () => {
    expect(
      areAllChildrenDone({ childStatusCategories: ["Done", "Done", "Done"] })
    ).toBe(true);
  });

  it("returns false when other statuses are detected", () => {
    expect(
      areAllChildrenDone({
        childStatusCategories: ["To Do", "Done", "In Progress"],
      })
    ).toBe(false);
  });
});

describe("findPreferredStatusId", () => {
  it("should return undefined specific transition is -1 (no transition)", () => {
    expect(
      findPreferredStatusId({
        issueId: "10000",
        issueStatusCategoryName: "To Do",
        defaultPeferredStatuses: undefined,
        specificPreferredStatuses: {
          "To Do": "-1",
          "In Progress": "-1",
          Done: "-1",
        },
      })
    ).toBeUndefined();
  });

  it("should return undefined when no default transition is configured, but specific configuration is to fall back to default", () => {
    expect(
      findPreferredStatusId({
        issueId: "10000",
        issueStatusCategoryName: "To Do",
        defaultPeferredStatuses: undefined,
        specificPreferredStatuses: {
          "To Do": "-2",
          "In Progress": "-2",
          Done: "-2",
        },
      })
    ).toBeUndefined();
  });

  it("should return the specific status id when configured", () => {
    expect(
      findPreferredStatusId({
        issueId: "10000",
        issueStatusCategoryName: "To Do",
        defaultPeferredStatuses: undefined,
        specificPreferredStatuses: {
          "To Do": "10030",
          "In Progress": "10031",
          Done: "10032",
        },
      })
    ).toBe("10030");
  });

  it("should return the default status id when configured", () => {
    expect(
      findPreferredStatusId({
        issueId: "10000",
        issueStatusCategoryName: "In Progress",
        defaultPeferredStatuses: {
          "To Do": "10030",
          "In Progress": "10031",
          Done: "10032",
        },
        specificPreferredStatuses: {
          "To Do": "-2",
          "In Progress": "-2",
          Done: "-2",
        },
      })
    ).toBe("10031");
  });

  it("should return the default status id when no specific configuration is available", () => {
    expect(
      findPreferredStatusId({
        issueId: "10000",
        issueStatusCategoryName: "Done",
        defaultPeferredStatuses: {
          "To Do": "10030",
          "In Progress": "10031",
          Done: "10032",
        },
        specificPreferredStatuses: undefined,
      })
    ).toBe("10032");
  });
});

describe("getSprintStartAndEndDates", () => {
  it("should return null values when no sprint is provided", () => {
    expect(getSprintStartAndEndDates({ sprint: undefined })).toEqual({
      startDate: null,
      endDate: null,
    });
  });

  it("should return startDate and completeDate from sprint for completed sprint", () => {
    expect(getSprintStartAndEndDates({ sprint: closedSprint })).toEqual({
      startDate: "1995-12-10",
      endDate: "1995-12-24",
    });
  });

  it("should return startDate and endDate from sprint for active sprint", () => {
    expect(getSprintStartAndEndDates({ sprint: activeSprint })).toEqual({
      startDate: "1995-12-10",
      endDate: "1995-12-17",
    });
  });

  it("should return null values for sprint with no dates", () => {
    expect(
      getSprintStartAndEndDates({ sprint: activeSprintWithoutDates })
    ).toEqual({
      startDate: null,
      endDate: null,
    });
  });
});
