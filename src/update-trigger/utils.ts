import {
  COMMON_PREFERRED_STATUSES_STORAGE_KEY,
  START_AND_END_FIELDS_STORAGE_KEY,
  SUPPORTED_PROJECTS_STORAGE_KEY,
} from "../../static/admin-page/src/common/constants";
import {
  PreferredDateFields,
  ProjectPreferences,
  SupportedProjects,
} from "../../static/admin-page/src/common/types";
import {
  addCommentToIssue,
  fetchCustomField,
  fetchIssue,
  fetchIssueTransitions,
  searchWithJql,
  transitionIssue,
  updateIssueCustomField,
} from "./restApi";
import {
  GetParentMinMaxDatesToSet,
  SetParentMinMaxDates,
  GetParentMinMaxDateValues,
  GetStartAndEndDatesToSet,
  DatesToSet,
} from "./types";
import { StartOrEndDateFieldHasUpdated } from "./types";
import {
  AddComment,
  AreAllChildrenDone,
  AreAllChildrenToDo,
  AreSomeChildrenInProgressOrDone,
  FindPreferredStatusId,
  GenerateProjectIssueTypeStatusesStorageKey,
  GenerateProjectPreferencesStorageKey,
  GetChildIssueStatusCategories,
  GetCustomField,
  GetMinMaxChildDates,
  GetParentChangeLogItem,
  GetPreferredDateFields,
  GetSprintChangeLogItem,
  GetSprintStartAndEndDates,
  IsProjectSupported,
  ShouldProcessIssueUpdate,
  TransitionIssueWithComment,
  UpdateDatesWithComment,
  UpdateIssueStartAndEndDatesForSprintAssignment,
  UpdateIssueStartAndEndDatesForTransition,
  UpdateParentStatus,
} from "./types";
import { storage } from "@forge/api";

const todoStatusCategoryName = "To Do";
const inprogressStatusCategoryName = "In Progress";
const doneStatusCategoryName = "Done";

// These are the fields that we need to check for re-parenting
const teamManagedParentField = "IssueParentAssociation";
const companyManagedEpicLinkField = "Epic Link";
const higherLevelParentLinkField = "Parent Link";

export const startOrEndDateFieldHasUpdated: StartOrEndDateFieldHasUpdated = ({
  changelogItems,
  preferredDateFields,
}) => {
  const shouldProcess = changelogItems.some((change) => {
    const { fieldId } = change;
    if (preferredDateFields) {
      const { startFieldId, endFieldId } = preferredDateFields;
      if (fieldId === startFieldId || fieldId === endFieldId) {
        return true;
      }
    }
    return false;
  });
  return shouldProcess;
};

/**
 * Checks to see whether or not the issue update should be processed.
 */
export const shouldProcessIssueUpdate: ShouldProcessIssueUpdate = ({
  changelogItems,
}) => {
  const shouldProcess = changelogItems.some((change) => {
    const { field } = change;
    return (
      field === "Sprint" ||
      field === "status" ||
      field === teamManagedParentField ||
      field === companyManagedEpicLinkField ||
      field === higherLevelParentLinkField
    );
  });
  return shouldProcess;
};

export const getSprintChangeLogItem: GetSprintChangeLogItem = ({
  changelogItems,
}) => {
  return changelogItems.find((change) => {
    const { field } = change;
    if (field === "Sprint") {
      return change;
    }
  });
};

/**
 * Returns the previous parent of the issue. This can be defined either as a "Parent Link", "Epic Link"
 * or "IssueParentAssociation" depending on the project type and hierarchy level. This may need updating
 * in the future when issue hierarchy is consolidated.
 */
export const getParentChangeLogItem: GetParentChangeLogItem = ({
  changelogItems,
}) => {
  return changelogItems.find((change) => {
    const { field } = change;
    if (
      field === teamManagedParentField ||
      field === companyManagedEpicLinkField ||
      field === higherLevelParentLinkField
    ) {
      return change;
    }
  });
};

/**
 * Status category preferences are saved to Forge storage based on the combination of a Project ID
 * and IssueType ID. This function is a duplication of a function with the same name in the static
 * source for the Custom UI module where configuration can be saved. It is duplicated to avoid
 * linter errors from the Forge CLI at deployment.
 */
export const generateProjectIssueTypeStatusesStorageKey: GenerateProjectIssueTypeStatusesStorageKey =
  ({ projectId, issueTypeId }) => {
    return `PROJECT:${projectId}-ISSUETYPE:${issueTypeId}`;
  };

export const generateProjectPreferencesStorageKey: GenerateProjectPreferencesStorageKey =
  ({ projectId }) => {
    return `PROJECT:${projectId}-PREFERENCES`;
  };

/**
 * Performs a JQL search to retrieve all child issues of the supplied parent. This assumes that all instances
 * will be using the same id of custom field to represent parentLink. The return value is just an array of
 * the names of the status categories (not the names of the statuses themselves).
 */
export const getChildIssueStatusCategories: GetChildIssueStatusCategories =
  async ({ parentKey, project }) => {
    const jql = `parent=${parentKey}`;
    const childIssues = (
      await searchWithJql({
        jql,
      })
    ).data;
    const childStatusCategories = childIssues.issues.map(
      (issue) => issue.fields.status.statusCategory.name
    );
    return childStatusCategories;
  };

/**
 * It is possible to configure which projects have been enabled to updating issue status. This information
 * is saved to the Forge storage as a JSON object and this function loads the object and queries it for the
 * supplied project id.
 */
export const isProjectSupported: IsProjectSupported = async ({
  issueId,
  projectId,
}) => {
  const supportedProjects: SupportedProjects | undefined = await storage.get(
    SUPPORTED_PROJECTS_STORAGE_KEY
  );

  const supportedProject = supportedProjects && supportedProjects[projectId];
  if (
    supportedProject === undefined ||
    supportedProject.isSupported === false
  ) {
    // If the project is not supported then exit early and don't do any more processing...
    console.log(`Issue ${issueId} is in an unsupported project ${projectId}`);
    return false;
  }
  return true;
};

/**
 * Returns true if all the entries in the supplied array of issue status categories names are 'To Do'
 */
export const areAllChildrenToDo: AreAllChildrenToDo = ({
  childStatusCategories,
}) => {
  if (childStatusCategories.length === 0) {
    return true;
  }
  const allChildrenToDo = childStatusCategories.every((category) => {
    return category === todoStatusCategoryName;
  });
  return allChildrenToDo;
};

/**
 * Returns true one or more entries in the supplied array of issue status categories names are
 * either 'In Progress' or 'Done'
 */
export const areSomeChildrenInProgressOrDone: AreSomeChildrenInProgressOrDone =
  ({ childStatusCategories }) => {
    const someChildrenInProgressOrDone = childStatusCategories.some(
      (category) => {
        return (
          category === inprogressStatusCategoryName ||
          category === doneStatusCategoryName
        );
      }
    );
    return someChildrenInProgressOrDone;
  };

/**
 * Returns true if all the entries in the supplied array of issue status categories names are 'Done'
 */
export const areAllChildrenDone: AreAllChildrenDone = ({
  childStatusCategories,
}) => {
  if (childStatusCategories.length === 0) {
    return false;
  }
  const allChildrenDone = childStatusCategories.every((category) => {
    return category === doneStatusCategoryName;
  });
  return allChildrenDone;
};

/**
 * Return the id of the issue status that is preferred to be set for the supplied category. This
 * can either the specific project and issue type configuration or could be the default value
 * (if no specific value is provided). If there is no configuration or the configuration indicates
 * that a transition shouldn't occur then undefined is returned.
 */
export const findPreferredStatusId: FindPreferredStatusId = ({
  issueId,
  issueStatusCategoryName,
  defaultPeferredStatuses,
  specificPreferredStatuses,
}) => {
  let preferredStatusId: string | undefined;
  if (specificPreferredStatuses !== undefined) {
    preferredStatusId = specificPreferredStatuses[issueStatusCategoryName];
    if (preferredStatusId === "-2") {
      // NOTE: A status id of "-2" means to fall back to the default...
      if (defaultPeferredStatuses !== undefined) {
        preferredStatusId = defaultPeferredStatuses[issueStatusCategoryName];
      } else {
        // Although the configuration is to use the defaults, there aren't any available!
        console.log(
          `Cannot update issue ${issueId} because configured preference is no DEFAULT transition (use default is configured)`
        );
        return undefined;
      }
    } else if (preferredStatusId === "-1") {
      // NOTE: A status of "-1" means to not transition...
      console.log(
        `Will not update issue ${issueId} because the configured preference is NOT to modify status`
      );
      return undefined;
    }
  } else if (defaultPeferredStatuses !== undefined) {
    // Fallback to defaults...
    preferredStatusId = defaultPeferredStatuses[issueStatusCategoryName];
  }

  return preferredStatusId;
};

/**
 * This function will attempt to transition the supplied issue to the configured status for the
 * supplied status category. If it is possible to perform the transition then the supplied comment
 * will also be added to the issue.
 */
export const transitionIssueWithComment: TransitionIssueWithComment = async ({
  issue,
  comment,
  issueStatusCategoryName,
}) => {
  const { id: issueId, fields } = issue;
  const { issuetype, project } = fields;
  const projectId = project.id;

  const availableTransitions = (
    await fetchIssueTransitions({
      issueIdOrKey: issueId,
    })
  ).data.transitions;

  const storageKey = generateProjectIssueTypeStatusesStorageKey({
    projectId,
    issueTypeId: issuetype.id,
  });
  const preferredStatusId = findPreferredStatusId({
    issueId,
    issueStatusCategoryName,
    specificPreferredStatuses: await storage.get(storageKey),
    defaultPeferredStatuses: await storage.get(
      COMMON_PREFERRED_STATUSES_STORAGE_KEY
    ),
  });

  const targetTransition = availableTransitions.find((transition) => {
    // Try to find a transition that BOTH matches the id and is available, but doesn't have a screen associated
    // Not all transitions are available for the current status, and it is not possible to transition an issue
    // if additional information is required (via a screen)...
    return (
      transition.to.id === preferredStatusId &&
      transition.isAvailable === true &&
      transition.hasScreen === false
    );
  });
  if (targetTransition === undefined) {
    console.log(
      `Could not find the target status of ${preferredStatusId} (without a screen) in the available transitions for issue ${issueId}`
    );

    await addComment({
      issueIdOrKey: issueId,
      projectId,
      comment: `The status of this issue is out of sync with it's child issues but it was not possible to update the issue automatically. Please check the status and manually update it as necessary`,
    });
    return;
  }

  await transitionIssue({
    issueIdOrKey: issueId,
    transitionId: targetTransition.id,
  });

  await addComment({
    issueIdOrKey: issueId,
    projectId,
    comment,
  });
};

/**
 * This function retrieves the details of a Custom Field with the supplied id. This is primarily
 * used for including the name of the custom field in comments added to issues when the field is updated.
 */
export const getCustomField: GetCustomField = async ({ customFieldId }) => {
  const results = await fetchCustomField({
    customFieldId: customFieldId,
  });
  if (results.data.values.length > 0) {
    return results.data.values[0];
  }
  return;
};

export const getPreferredDateField = (
  projectPreferredDateField: string,
  globalPreferredDateField: string | undefined
): string | undefined => {
  if (projectPreferredDateField !== "-1") {
    return projectPreferredDateField;
  }
  return globalPreferredDateField;
};

export const getPreferredDateFields: GetPreferredDateFields = async ({
  projectPreferences,
}) => {
  // Check for a project preferred custom field id. If this is not set then we'll use the
  // global configuration. But if it is configured as "-1" then it indicates a preference
  // to also use global configuration, so default to "-1" (which is not a valid custom field id)
  const projectPreferredStartCustomFieldId =
    projectPreferences?.startFieldId || "-1";
  const projectPreferredEndCustomFieldId =
    projectPreferences?.endFieldId || "-1";

  console.log(
    "Project preferred date fields",
    projectPreferredStartCustomFieldId,
    projectPreferredEndCustomFieldId
  );

  const preferredDateFields: PreferredDateFields | undefined =
    await storage.get(START_AND_END_FIELDS_STORAGE_KEY);

  console.log(
    "Global preferred date fields",
    preferredDateFields?.START,
    preferredDateFields?.END
  );

  const startCustomFieldId = getPreferredDateField(
    projectPreferredStartCustomFieldId,
    preferredDateFields?.START
  );
  const endCustomFieldId = getPreferredDateField(
    projectPreferredEndCustomFieldId,
    preferredDateFields?.END
  );

  console.log("Using custom fields", startCustomFieldId, endCustomFieldId);

  if (startCustomFieldId === undefined || endCustomFieldId === undefined) {
    // No preferred date fields have been configured
    console.log("No preferred date fields configured");
    return;
  }

  // TODO: This might be an issue if enabled for projects, but not globally
  const enabled =
    preferredDateFields?.enabled && projectPreferences?.dateFieldsEnabled;
  if (enabled === false && projectPreferences?.dateFieldsEnabled === false) {
    console.log(`Updating start and end date fields is not enabled`);
    return;
  }
  if (startCustomFieldId === undefined || endCustomFieldId == undefined) {
    console.log(
      `Both start and end date fields need to be configured, START = '${startCustomFieldId}' END = '${endCustomFieldId}'`
    );
    return;
  }

  const startCustomField = await getCustomField({
    customFieldId: startCustomFieldId,
  });
  const endCustomField = await getCustomField({
    customFieldId: endCustomFieldId,
  });
  if (startCustomField === undefined || endCustomField == undefined) {
    console.log(
      `Both start and end date fields need to exist, START = '${startCustomField}' END = '${endCustomField}'`
    );
    return;
  }
  return {
    startFieldId: startCustomField.id,
    startFieldName: startCustomField.name,
    endFieldId: endCustomField.id,
    endFieldName: endCustomField.name,
  };
};

export const getSprintStartAndEndDates: GetSprintStartAndEndDates = ({
  sprint,
}) => {
  let startDate: string | null = null;
  let endDate: string | null = null;
  if (sprint) {
    if (sprint.state === "closed" && sprint.completeDate && sprint.startDate) {
      // If the sprint is closed, we should use the completed date, not the end date
      startDate = sprint.startDate.split("T")[0];
      endDate = sprint.completeDate.split("T")[0];
    } else if (sprint.startDate && sprint.endDate) {
      // If the sprint is in progress or in the future we should use the end date
      startDate = sprint.startDate.split("T")[0];
      endDate = sprint.endDate.split("T")[0];
    }
  }
  return { startDate, endDate, datetype: "SPRINT" };
};

/**
 *
 */
export const updateIssueStartAndEndDatesForSprintAssignment: UpdateIssueStartAndEndDatesForSprintAssignment =
  async ({
    issueIdOrKey,
    projectId,
    sprint,
    statusCategoryName,
    preferredDateFields,
  }) => {
    if (sprint === undefined) {
      console.log("No sprint assigned for issue", issueIdOrKey);
      return;
    }

    if (preferredDateFields === undefined) {
      console.log("No preferred date fields configured");
      return;
    }

    const { startFieldId, startFieldName, endFieldId, endFieldName } =
      preferredDateFields;
    const { startDate, endDate } = getSprintStartAndEndDates({ sprint });

    if (statusCategoryName === "To Do") {
      console.log(
        "Updating start and end dates for issue",
        issueIdOrKey,
        startDate,
        endDate
      );
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        datesToSet: "BOTH",
        startDate,
        endDate,
        startFieldId,
        endFieldId,
        comment: `Setting '${startFieldName}' and '${endFieldName}' as a result of assigning a sprint`,
      });
    } else if (statusCategoryName === "In Progress") {
      console.log("Updating end dates for issue", issueIdOrKey, endDate);
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        datesToSet: "END",
        startDate,
        endDate,
        startFieldId,
        endFieldId,
        comment: `Setting '${endFieldName}' as a result of assigning a sprint`,
      });
    } else if (statusCategoryName === "Done") {
      // Don't change anything for DONE issues!
    }
  };

const getStartAndEndDatesToSet: GetStartAndEndDatesToSet = async ({
  issueIdOrKey,
  projectId,
  preferredDateFields,
  sprint,
  projectPreferences,
}) => {
  const minMaxDates = await getParentMinMaxDateValues({
    issueIdOrKey,
    projectId,
    preferredDateFields,
    projectPreferences,
  });
  if (minMaxDates !== undefined) {
    console.log(
      `Using min/max dates to set ${issueIdOrKey} on transition: ${minMaxDates.earliestStartString} -> ${minMaxDates.latestEndString}`
    );
    return {
      startDate: minMaxDates.earliestStartString,
      endDate: minMaxDates.latestEndString,
      datetype: "CHILD_MIN_MAX",
    };
  } else if (sprint !== undefined) {
    const sprintDates = getSprintStartAndEndDates({ sprint });
    if (sprintDates !== undefined) {
      console.log(
        `Using sprint dates to set ${issueIdOrKey} on transition: ${sprintDates.startDate} -> ${sprintDates.endDate}`
      );
      return sprintDates;
    }
  }
  console.log(
    `Neither min/max nor sprint dates available to set ${issueIdOrKey} on transition`
  );
  return {
    startDate: null,
    endDate: null,
    datetype: "NONE",
  };
};

/**
 * This function reviews the supplied current and target status category names to determine whether or
 * not a start and/or end date field should be updated. The date fields to update are retrieved from
 * Forge Storage and updates will only be made if both start and end dates are configured and the
 * automatic date field update capability has been enabled.
 */
export const updateIssueStartAndEndDatesForTransition: UpdateIssueStartAndEndDatesForTransition =
  async ({
    currentStatusCategoryName,
    targetStatusCategoryName,
    issueIdOrKey,
    projectId,
    sprint,
    preferredDateFields,
  }) => {
    const today = new Date().toISOString().split("T")[0];

    if (preferredDateFields === undefined) {
      return;
    }

    const { startFieldId, startFieldName, endFieldId, endFieldName } =
      preferredDateFields;

    const projectPreferences: ProjectPreferences | undefined =
      await storage.get(
        generateProjectPreferencesStorageKey({
          projectId,
        })
      );
    const { startDate, endDate, datetype } = await getStartAndEndDatesToSet({
      issueIdOrKey,
      projectId,
      preferredDateFields,
      sprint,
      projectPreferences,
    });

    let doneDate = today;
    if (
      datetype === "CHILD_MIN_MAX" &&
      endDate !== null &&
      Date.parse(today) < Date.parse(endDate)
    ) {
      // Target end date is later than today, we should use this
      doneDate = endDate;
    }

    if (
      currentStatusCategoryName === "To Do" &&
      targetStatusCategoryName === "In Progress"
    ) {
      // Moving from TODO -> IN PROGRESS
      // When moving from TODO to IN PROGRESS we need to set the start date as TODAY, and we should set the end date as the end of
      // the sprint (if a date is available)
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate: today,
        endDate,
        datesToSet: datetype === "NONE" ? "START" : "BOTH",
        comment: `Setting '${startFieldName}' as a result of moving issue from a 'To Do' status to an 'In Progress' status`,
      });
    } else if (
      currentStatusCategoryName === "To Do" &&
      targetStatusCategoryName === "Done"
    ) {
      // Moving from TODO -> DONE
      // When moving from TODO to DONE in a single step, we need to set both start and end dates to today
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate: today,
        endDate: doneDate,
        datesToSet: "BOTH",
        comment: `Setting '${startFieldName}' and '${endFieldName}'as a result of moving issue from a 'To Do' status to a 'Done' status`,
      });
    } else if (
      currentStatusCategoryName === "In Progress" &&
      targetStatusCategoryName === "To Do"
    ) {
      // Moving from IN PROGRESS -> TO DO
      // When moving to TODO we need to clear BOTH the start and end field...
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate,
        endDate,
        datesToSet: "BOTH",
        comment: `Resetting '${startFieldName}' and '${endFieldName}' as a result of moving issue to a 'To Do' status`,
      });
    } else if (
      currentStatusCategoryName === "In Progress" &&
      targetStatusCategoryName === "Done"
    ) {
      // Moving from IN PROGRESS -> Done
      // When moving from IN PROGRESS to DONE, we need to set the end date to today
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate,
        endDate: doneDate,
        datesToSet: "END",
        comment: `Setting '${endFieldName}' as a result of moving issue from an  'In Progress' status to a 'Done' status`,
      });
    } else if (
      currentStatusCategoryName === "Done" &&
      targetStatusCategoryName === "To Do"
    ) {
      // Moving from DONE -> TO DO
      // When moving to from DONE to TODO we need to reset BOTH the start and end field...
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate,
        endDate,
        datesToSet: "BOTH",
        comment: `Resetting '${startFieldName}' and '${endFieldName}' as a result of moving issue to a 'To Do' status`,
      });
    } else if (
      currentStatusCategoryName === "Done" &&
      targetStatusCategoryName === "In Progress"
    ) {
      // Moving from DONE -> In Progress
      // When moving from DONE to In Progress we need to reset the end date
      await updateDatesWithComment({
        issueIdOrKey,
        projectId,
        startFieldId,
        endFieldId,
        startDate,
        endDate,
        datesToSet: "END",
        comment: `Resetting '${endFieldName}' as a result of moving issue to a 'In Progress' status`,
      });
    }
  };

/**
 * This function will update the start and/or end dates of an issue with the supplied values
 * and leave a comment (if comments are enabled).
 */
export const updateDatesWithComment: UpdateDatesWithComment = async ({
  issueIdOrKey,
  projectId,
  startFieldId,
  endFieldId,
  startDate,
  endDate,
  datesToSet,
  comment,
}) => {
  const customFields: Array<{
    id: string;
    value: any;
  }> = [];

  if (datesToSet === "NONE") {
    console.log("No dates to set for issue", issueIdOrKey);
    return;
  }

  if ((datesToSet === "BOTH" || datesToSet === "END") && endDate) {
    const today = new Date().toISOString().split("T")[0];
    if (Date.parse(today) > Date.parse(endDate)) {
      console.log(
        `Issue ${issueIdOrKey} is assigned to a sprint with an end date in the past`
      );
      await addComment({
        issueIdOrKey,
        projectId,
        comment: `This issue is assigned to a sprint configured with an end date in the past!`,
      });
    }
  }

  if (datesToSet === "START" || datesToSet === "BOTH") {
    customFields.push({ id: startFieldId, value: startDate });
  }
  if (datesToSet === "END" || datesToSet === "BOTH") {
    customFields.push({ id: endFieldId, value: endDate });
  }

  await updateIssueCustomField({
    issueIdOrKey,
    customFields,
  });
  return await addComment({
    issueIdOrKey,
    projectId,
    comment,
  });
};

export const updateParentStatus: UpdateParentStatus = async ({
  parentId,
  project,
  issue,
  preferredDateFields,
}) => {
  const parent = (
    await fetchIssue({
      issueIdOrKey: parentId,
    })
  ).data;

  // We need to check whether or not the project that the parent issue belongs to is supported
  // for automatic state transition. It is important to use the project id from the parent and
  // not the trigger issue because it is the parent that we will be updating...
  const parentProjectId = parent.fields.project.id;
  const isParentProjectSupported = await isProjectSupported({
    issueId: parentId,
    projectId: parentProjectId,
  });
  if (!isParentProjectSupported) {
    console.log("Parent project is not supported", parentProjectId);
    return;
  }

  // Get all of the status categories of the children of the parent (i.e. the trigger issue and
  // its siblings) this will help us determine what changes need to be made to the status of the
  // parent issue...
  const childStatusCategories = await getChildIssueStatusCategories({
    parentKey: parentId,
    project,
  });

  const parentStatusCategoryName = parent.fields.status.statusCategory.name;

  const allChildrenDone = areAllChildrenDone({ childStatusCategories });
  if (allChildrenDone && parentStatusCategoryName !== "Done") {
    console.log(`Updating status of ${parent.key} to preferred 'Done' status`);
    await transitionIssueWithComment({
      issue: parent,
      issueStatusCategoryName: "Done",
      comment: `Updating status to configured 'Done' status because all child issues are complete. This was triggered by a change made to ${issue.key}`,
    });

    await updateIssueStartAndEndDatesForTransition({
      currentStatusCategoryName: parentStatusCategoryName,
      targetStatusCategoryName: "Done",
      issueIdOrKey: parent.key,
      projectId: project.id,
      preferredDateFields,
    });

    return;
  }

  const allChildrenToDo = areAllChildrenToDo({ childStatusCategories });
  if (allChildrenToDo && parentStatusCategoryName !== "To Do") {
    console.log(`Updating status of ${parent.key} to preferred 'To Do' status`);
    await transitionIssueWithComment({
      issue: parent,
      issueStatusCategoryName: "To Do",
      comment: `Updating status to configured 'To Do' status because no child issues have been started. This was triggered by a change made to ${issue.key}`,
    });

    await updateIssueStartAndEndDatesForTransition({
      currentStatusCategoryName: parentStatusCategoryName,
      targetStatusCategoryName: "To Do",
      issueIdOrKey: parent.key,
      projectId: project.id,
      preferredDateFields,
    });

    return;
  }

  const someChildrenInProgressOrDone = areSomeChildrenInProgressOrDone({
    childStatusCategories,
  });

  if (
    someChildrenInProgressOrDone &&
    parentStatusCategoryName !== "In Progress"
  ) {
    console.log(
      `Updating status of ${parent.key} to preferred 'In Progress' status`
    );
    await transitionIssueWithComment({
      issue: parent,
      issueStatusCategoryName: "In Progress",
      comment: `Updating status to configured 'In Progress' status because some child issues are either in progress or done. This was triggered by a change made to ${issue.key}`,
    });

    await updateIssueStartAndEndDatesForTransition({
      currentStatusCategoryName: parentStatusCategoryName,
      targetStatusCategoryName: "In Progress",
      issueIdOrKey: parent.key,
      projectId: project.id,
      preferredDateFields,
    });

    return;
  }

  // If there is no status changes, just check the parent dates...
  setParentMinMaxDates({ parent, preferredDateFields });
};

/**
 * This function will check to see whether commenting is enabled and then add comment
 * provided to the issue with the supplied ID or key.
 */
export const addComment: AddComment = async ({
  issueIdOrKey,
  projectId,
  comment,
}) => {
  const projectPreferences: ProjectPreferences | undefined = await storage.get(
    generateProjectPreferencesStorageKey({ projectId })
  );

  if (
    projectPreferences === undefined ||
    projectPreferences.commentsEnabled === undefined ||
    projectPreferences.commentsEnabled === true
  ) {
    return addCommentToIssue({ issueIdOrKey, comment });
  }
  return;
};

// This function determines what dates to set on the parent issue...
export const getParentMinMaxDatesToSet: GetParentMinMaxDatesToSet = ({
  earliestStart,
  latestEnd,
}) => {
  if (earliestStart !== undefined && latestEnd !== undefined) {
    return "BOTH";
  } else if (earliestStart !== undefined) {
    return "START";
  } else if (latestEnd !== undefined) {
    return "END";
  }
  return;
};

export const getParentMinMaxDateValues: GetParentMinMaxDateValues = async ({
  issueIdOrKey,
  projectId,
  preferredDateFields,
  projectPreferences,
}) => {
  if (
    projectPreferences === undefined ||
    !(
      projectPreferences.childMinMaxDatesEnabled &&
      projectPreferences.shrinkParentEnabled
    )
  ) {
    console.log(
      `Will not set min/max dates for ${issueIdOrKey} because child inheritance is not enabled for ${projectId}`
    );
    return;
  }
  if (preferredDateFields !== undefined) {
    const { startFieldId, endFieldId } = preferredDateFields;

    const minMaxChildDates = await getMinMaxChildDates({
      parentKey: issueIdOrKey,
      startFieldId,
      endFieldId,
    });
    return minMaxChildDates;
  }
};

export const setParentMinMaxDates: SetParentMinMaxDates = async ({
  parent,
  preferredDateFields,
}) => {
  const projectId = parent.fields.project.id;
  const projectPreferences: ProjectPreferences | undefined = await storage.get(
    generateProjectPreferencesStorageKey({
      projectId,
    })
  );

  const childMinMaxDatesEnabled = projectPreferences?.childMinMaxDatesEnabled;
  const shrinkParentEnabled = projectPreferences?.shrinkParentEnabled;
  const minMaxChildDates = await getParentMinMaxDateValues({
    projectId,
    issueIdOrKey: parent.key,
    preferredDateFields,
    projectPreferences,
  });

  if (preferredDateFields !== undefined && minMaxChildDates !== undefined) {
    const { earliestStartString, latestEndString, hasIncompleteChildren } =
      minMaxChildDates;
    if (earliestStartString === null && latestEndString === null) {
      // When there are no dates, don't make any updates!
      console.log(
        `Neither min nor max date found for children of ${parent.key}`
      );
      return;
    }

    const { startFieldId, endFieldId } = preferredDateFields;

    // Initially assume that both dates should be set...
    let datesToSet: DatesToSet = "BOTH";

    // GROW
    if (childMinMaxDatesEnabled && !shrinkParentEnabled) {
      // Do NOT set the end date if the parent has incomplete children, and the current parent end date
      // is later than the current end date...
      // The reason for this is to avoid the case where a child dates have not been set and still need to
      // be completed. Setting the parent to have the date of the last completed child is not helpful!
      if (
        hasIncompleteChildren &&
        latestEndString !== null &&
        parent.fields[endFieldId] !== null
      ) {
        const latestDate = Date.parse(latestEndString);
        const parentEndDate = Date.parse(parent.fields[endFieldId]);
        if (latestDate < parentEndDate) {
          // Do not set the end date
          datesToSet = "START";
        }
      }

      if (earliestStartString === null) {
        if (datesToSet === "START") {
          // If we were ONLY planning to set a START date, but there isn't one, then we shouldn't set any!
          datesToSet = "NONE";
        } else {
          // If we were planning on setting BOTH dates, but there is no start date - just set the end date
          datesToSet = "END";
        }
      } else if (latestEndString === null) {
        datesToSet = "START";
      }
    } else if (childMinMaxDatesEnabled && shrinkParentEnabled) {
      // SHRINK
      if (earliestStartString && latestEndString) {
        datesToSet = "BOTH";
      } else if (earliestStartString) {
        datesToSet = "START";
      } else if (latestEndString) {
        datesToSet = "END";
      } else {
        datesToSet = "NONE";
      }
    }

    if (datesToSet === "START") {
      console.log(
        `Updating start date of ${parent.key} to match children: ${earliestStartString} (will not set end date )`
      );
    } else if (datesToSet === "END") {
      console.log(
        `Updating end date of ${parent.key} to match children: ${latestEndString} (will not set start date )`
      );
    } else if (datesToSet === "BOTH") {
      console.log(
        `Updating start and end dates of ${parent.key} to match min/max of children: ${earliestStartString} -> ${latestEndString}`
      );
    }

    return await updateDatesWithComment({
      issueIdOrKey: parent.key,
      projectId: parent.fields.project.id,
      datesToSet,
      startFieldId,
      endFieldId,
      startDate: earliestStartString || null,
      endDate: latestEndString || null,
      comment:
        "Updated start and end dates to span the date range of child issues",
    });
  }
};

/**
 * This function will return the earliest start date and latest end date from the supplied
 * parent's children
 */
export const getMinMaxChildDates: GetMinMaxChildDates = async ({
  parentKey,
  startFieldId,
  endFieldId,
}) => {
  const jql = `parent=${parentKey}`;
  const childIssues = (
    await searchWithJql({
      jql,
    })
  ).data;

  if (childIssues.issues.length === 0) {
    return;
  }

  let earliestStart: number | undefined = undefined;
  let latestEnd: number | undefined = undefined;
  let earliestStartString: string | undefined = undefined;
  let latestEndString: string | undefined = undefined;

  let hasIncompleteChildren = false;

  childIssues.issues.forEach((issue) => {
    const currentStart = issue.fields[startFieldId];
    const currentEnd = issue.fields[endFieldId];

    if (issue.fields.status.statusCategory.name !== "Done") {
      hasIncompleteChildren = true;
    }

    if (currentStart !== null) {
      const currentStartDate = Date.parse(currentStart);
      if (earliestStart === undefined || earliestStart > currentStartDate) {
        earliestStart = currentStartDate;
        earliestStartString = currentStart;
      }
    }
    if (currentEnd !== null) {
      const currentEndDate = Date.parse(currentEnd);
      if (latestEnd === undefined || latestEnd < currentEndDate) {
        latestEnd = currentEndDate;
        latestEndString = currentEnd;
      }
    }
  });

  return {
    earliestStartString: earliestStartString || null,
    latestEndString: latestEndString || null,
    hasIncompleteChildren,
  };
};
