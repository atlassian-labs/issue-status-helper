import { storage } from "@forge/api";
import { ProjectPreferences } from "../../static/admin-page/src/common/types";
import { fetchIssue, fetchStatus } from "./restApi";
import { UpdateEvent } from "./types";
import {
  generateProjectPreferencesStorageKey,
  getParentChangeLogItem,
  getPreferredDateFields,
  getSprintChangeLogItem,
  isProjectSupported,
  setParentMinMaxDates,
  shouldProcessIssueUpdate,
  startOrEndDateFieldHasUpdated,
  updateIssueStartAndEndDatesForSprintAssignment,
  updateIssueStartAndEndDatesForTransition,
  updateParentStatus,
} from "./utils";

export async function run(event: UpdateEvent) {
  const changelogItems = event.changelog.items;
  console.log(
    `Detected that ${event.issue.key} has been updated`,
    JSON.stringify(changelogItems)
  );

  const preferredDateFields = await getPreferredDateFields({});

  if (startOrEndDateFieldHasUpdated({ changelogItems, preferredDateFields })) {
    console.log(
      `Issue ${event.issue.key} was updated with start and/or end date changes`
    );
    const issueIdOrKey = event.issue.id;
    const issue = (await fetchIssue({ issueIdOrKey })).data;
    const { fields: issueFields } = issue;
    const { parent: parentRef } = issueFields;
    if (parentRef) {
      const parent = (
        await fetchIssue({
          issueIdOrKey: parentRef.key,
        })
      ).data;
      await setParentMinMaxDates({ parent, preferredDateFields });
    }
  }

  if (!shouldProcessIssueUpdate({ changelogItems })) {
    // Iterate over the items in the change log to verify whether or not a change of status
    // was part of this issue update event. We only want to perform any action if the status
    // has changed...
    return;
  }

  const parentChangeLogItem = getParentChangeLogItem({ changelogItems });
  const statusTransition = event.changelog.items.find(
    (change) => change.field === "status"
  );

  const issueIdOrKey = event.issue.key;
  const issue = (await fetchIssue({ issueIdOrKey })).data;
  const { id: issueId, fields: issueFields } = issue;
  const { parent: parentRef, project, customfield_10020: sprint } = issueFields;

  const sprintChangeLogItem = getSprintChangeLogItem({ changelogItems });
  if (sprintChangeLogItem) {
    const projectPreferences: ProjectPreferences | undefined =
      await storage.get(
        generateProjectPreferencesStorageKey({ projectId: project.id })
      );
    if (
      projectPreferences !== undefined &&
      projectPreferences.sprintDatesEnabled === true
    ) {
      console.log(`Handling sprint assignment for issue ${issue.key}`);
      await updateIssueStartAndEndDatesForSprintAssignment({
        issueIdOrKey: issue.key,
        projectId: project.id,
        sprint: sprint && sprint[0],
        statusCategoryName: issue.fields.status.statusCategory.name,
        preferredDateFields,
      });

      // If the issue has a parent then update the parent dates...
      if (parentRef) {
        const parent = (
          await fetchIssue({
            issueIdOrKey: parentRef.key,
          })
        ).data;
        await setParentMinMaxDates({ parent, preferredDateFields });
      }
    } else {
      console.log(
        `Ignoring sprint assignment for  ${issue.key}, because setting sprint dates is disabled for project`
      );
    }

    return;
  }

  // We want to fetch the details of the status change because they are not included in the
  // changelog item. This is necessary because we want to check whether or not we want to
  // set or clear start and end dates based on the transition. So when moving from a
  // TODO to an INPROGRESS state we would want to set the start date...
  if (statusTransition) {
    const previousIssueStatus = (
      await fetchStatus({ statusId: statusTransition.from as string })
    ).data;
    const newIssueStatus = (
      await fetchStatus({ statusId: statusTransition.to as string })
    ).data;

    console.log(
      `Issue ${event.issue.key} moved from ${previousIssueStatus.name} to ${newIssueStatus.name}`
    );

    // Check to see whether or not the project that the issue belongs to is support for setting
    // start and end field value on transitions...
    const isIssueProjectSupported = await isProjectSupported({
      issueId,
      projectId: project.id,
    });
    if (isIssueProjectSupported) {
      await updateIssueStartAndEndDatesForTransition({
        currentStatusCategoryName: previousIssueStatus.statusCategory.name,
        targetStatusCategoryName: newIssueStatus.statusCategory.name,
        issueIdOrKey,
        projectId: project.id,
        sprint: sprint && sprint[0],
        preferredDateFields,
      });
    }
  } else {
    console.log(`No status transition for issue ${issue.key}`);
  }

  if (parentChangeLogItem) {
    const { to, toString, from, fromString } = parentChangeLogItem;
    if (from || fromString) {
      const parentId = (from as string) || (fromString as string);
      console.log(
        `Updating previous parent of ${issue.key} (which is ${parentId})`
      );
      await updateParentStatus({
        parentId,
        project,
        issue,
        preferredDateFields,
      });
    }
    if (to || toString) {
      const parentId = (to as string) || (toString as string);
      console.log(`Updating new parent of ${issue.key} (which is ${parentId})`);
      await updateParentStatus({
        parentId,
        project,
        issue,
        preferredDateFields,
      });
    }
    return;
  } else if (statusTransition && parentRef) {
    console.log(
      `Updating status of current parent of ${issue.key} (which is ${parentRef.key})`
    );
    await updateParentStatus({
      parentId: parentRef.id,
      project,
      issue,
      preferredDateFields,
    });
    return;
  }
}
