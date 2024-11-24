import { Stack } from "@atlaskit/primitives";
import Heading from "@atlaskit/heading";
import { LevelToIssueTypeMap } from "./ProjectDetails";
import { IssueType } from "../types";
import { IssueTypeStatuses } from "./IssueTypeStatuses";

type IssueTypeForHierarchyLevelsProps = {
  levelToIssueTypes: LevelToIssueTypeMap;
  projectId: string;
  allIssueTypes: IssueType[];
};

type GenerateProjectIssueTypeStatusesStorageKey = (args: {
  projectId: string;
  issueTypeId: string;
}) => string;

export const IssueMappingForHierarchyLevels = (
  props: IssueTypeForHierarchyLevelsProps
) => {
  const { levelToIssueTypes, projectId, allIssueTypes } = props;
  const hierarchy = levelToIssueTypes.map(
    (projectIssueTypes, hierarchyLevel) => {
      const issueTypesList = projectIssueTypes
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((issueType) => {
          const { id: issueTypeId, name: issueTypeName, statuses } = issueType;
          const storageKey = generateProjectIssueTypeStatusesStorageKey({
            projectId,
            issueTypeId,
          });
          const fullIssueType = allIssueTypes.find(
            (issueType) => issueType.id === issueTypeId
          );
          return (
            <IssueTypeStatuses
              key={storageKey}
              issueTypeIconUrl={fullIssueType?.iconUrl}
              issueTypeId={issueTypeId}
              issueTypeName={issueTypeName}
              statuses={statuses}
              storageKey={storageKey}
            />
          );
        });
      return (
        <Stack space="space.200">
          <Heading level="h500">Hierarchy Level: {hierarchyLevel + 1}</Heading>
          <Stack space="space.200">{issueTypesList}</Stack>
        </Stack>
      );
    }
  );

  return <>{hierarchy.reverse()}</>;
};

const generateProjectIssueTypeStatusesStorageKey: GenerateProjectIssueTypeStatusesStorageKey =
  ({ projectId, issueTypeId }) => {
    return `PROJECT:${projectId}-ISSUETYPE:${issueTypeId}`;
  };
