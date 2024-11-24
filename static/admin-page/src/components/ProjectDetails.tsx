import { useEffect, useState } from "react";
import { requestJira } from "@forge/bridge";
import EmptyState from "@atlaskit/empty-state";
import Spinner from "@atlaskit/spinner";
import { IssueType, Project, ProjectIssueType } from "../types";
import { Inline, Stack } from "@atlaskit/primitives";
import Image from "@atlaskit/image";
import Heading from "@atlaskit/heading";
// @ts-ignore
import NoResultsImage from "../images/file-link-no-results.png";
import { ProjectConfig } from "./ProjectConfig";
import { ProjectStartAndEndFields } from "./ProjectStartAndEndFields";
import { IssueMappingForHierarchyLevels } from "./IssueMappingForHierarchyLevels";

type ProjectDetailsProps = {
  projectId?: string;
  projectsLoaded: boolean;
  projectAdminView?: boolean;
};

type GenerateProjectPreferencesStorageKey = (args: {
  projectId: string;
}) => string;

export type LevelToIssueTypeMap = Array<ProjectIssueType[]>;

export const generateProjectPreferencesStorageKey: GenerateProjectPreferencesStorageKey =
  ({ projectId }) => {
    return `PROJECT:${projectId}-PREFERENCES`;
  };

export const ProjectDetails = (props: ProjectDetailsProps) => {
  const { projectId, projectsLoaded, projectAdminView = false } = props;

  if (!projectsLoaded || projectId === undefined) {
    return (
      <EmptyState
        header="Select a project"
        description="To configure the preferred statuses for each issue type, select a project from the list"
        imageUrl={NoResultsImage}
      />
    );
  }
  const [projectIssueTypes, setProjectIssueTypes] = useState<
    ProjectIssueType[] | undefined
  >(undefined);

  const [project, setProject] = useState<Project | undefined>();

  const [allIssueTypes, setAllIssueTypes] = useState<IssueType[] | undefined>();

  useEffect(() => {
    requestJira(`/rest/api/2/project/${projectId}`)
      .then((response) => response.json())
      .then((responseBody) => setProject(responseBody));
  }, [projectId]);

  useEffect(() => {
    requestJira(`/rest/api/3/issuetype`)
      .then((response) => response.json())
      .then((responseBody) => setAllIssueTypes(responseBody));
  }, []);

  useEffect(() => {
    if (projectId !== undefined) {
      requestJira(`/rest/api/2/project/${projectId}/statuses`)
        .then((response) => response.json())
        .then((responseBody) => setProjectIssueTypes(responseBody));
    }
  }, [projectId]);

  if (
    project === undefined ||
    projectIssueTypes === undefined ||
    allIssueTypes === undefined
  ) {
    return <Spinner />;
  }

  const { name: projectName, key, avatarUrls } = project;

  // Create a map of all the hierarchy levels so that they can be displayed in order...
  const levelToIssueTypes: LevelToIssueTypeMap = projectIssueTypes.reduce(
    (lastLevelToIssueTypes, projectIssueType) => {
      const issueType = allIssueTypes.find(
        (issueType) => issueType.id === projectIssueType.id
      );
      if (issueType) {
        const { hierarchyLevel } = issueType;

        // Don't include any sub-tasks...
        if (hierarchyLevel === -1) {
          return lastLevelToIssueTypes;
        }
        let issueTypesForLevel = lastLevelToIssueTypes[hierarchyLevel];
        if (issueTypesForLevel === undefined) {
          issueTypesForLevel = [];
          lastLevelToIssueTypes[hierarchyLevel] = issueTypesForLevel;
        }
        issueTypesForLevel.push(projectIssueType);
      }
      return lastLevelToIssueTypes;
    },
    [] as LevelToIssueTypeMap
  );

  // Unfortunately it is not possible for Custom UI to load images from the URLs provided in the REST API
  // responses. It is necessary to generate a URL using the product host domain rather than the api.atlassian.com
  // domain. performing this step will ensure that there are no broken images.
  const domain = window.location.ancestorOrigins[0];
  const imageUrl = new URL(avatarUrls["24x24"]);
  const conertedImageUrl = `${domain}/rest/api/${
    imageUrl.pathname.split("/rest/api/")[1]
  }${imageUrl.search}`;

  return (
    <Stack space="space.200">
      {!projectAdminView && (
        <Inline alignBlock="center" space="space.100">
          <Image style={{ height: 24 }} src={conertedImageUrl}></Image>
          <Heading level="h600">{`${projectName} (${key})`}</Heading>
        </Inline>
      )}
      <Stack space="space.250">
        <Stack space="space.100">
          {!projectAdminView && <Heading level="h500">Preferences</Heading>}
          <ProjectConfig
            storageKey={generateProjectPreferencesStorageKey({ projectId })}
          />
          <ProjectStartAndEndFields projectId={projectId} />
        </Stack>
        <IssueMappingForHierarchyLevels
          allIssueTypes={allIssueTypes}
          levelToIssueTypes={levelToIssueTypes}
          projectId={projectId}
        />
      </Stack>
    </Stack>
  );
};
