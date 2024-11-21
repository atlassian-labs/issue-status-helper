import { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import { Label } from "@atlaskit/form";
import { Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import Toggle from "@atlaskit/toggle";
import { ProjectDetails } from "./components/ProjectDetails";
import { ExtensionContext, UpdateSupportedProject } from "./types";
import { SupportedProject, SupportedProjects } from "./common/types";
import { SUPPORTED_PROJECTS_STORAGE_KEY } from "./common/constants";
import SectionMessage from "@atlaskit/section-message";
import { StartAndEndFields } from "./components/StartAndEndFields";

type ProjectPageProps = {
  extensionContext: ExtensionContext;
};

function ProjectPage(props: ProjectPageProps) {
  const {
    extensionContext: {
      project: { id, key },
    },
  } = props;

  const [supportedProjects, setSupportedProjects] = useState<
    SupportedProjects | undefined
  >(undefined);

  useEffect(() => {
    invoke("loadData", {
      key: SUPPORTED_PROJECTS_STORAGE_KEY,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const storedSupportedProjects: SupportedProjects = response;

      // @ts-ignore - Need to trust the data
      if (storedSupportedProjects === undefined) {
        // No data has been stored yet, no action
      } else {
        setSupportedProjects(storedSupportedProjects);
      }
    });
  }, []);

  const onSupportedChange: UpdateSupportedProject = ({
    projectId,
    isSupported,
  }) => {
    const upddatedSupportedProject: SupportedProject = {
      id: projectId,
      isSupported,
    };

    const updatedSupportedProjects = {
      ...supportedProjects,
      [projectId]: upddatedSupportedProject,
    };

    setSupportedProjects(updatedSupportedProjects);
    invoke("saveData", {
      key: SUPPORTED_PROJECTS_STORAGE_KEY,
      value: updatedSupportedProjects,
    });
  };

  if (supportedProjects === undefined) {
    return <Spinner />;
  }
  const isSupported = supportedProjects[id]?.isSupported || false;

  return (
    <Stack space="space.150">
      <SectionMessage title="Automatic issue hierarchy updates">
        <p>
          When enabled Issue Status Helper is enabled it will update the status
          of issues within a hierarchy. It is also possible to enable assignment
          of the start and end dates and control whether or not comments are
          added to the issue.
        </p>
        <p>
          These controls only effect the current project. Please contact your
          site admin to configure the workflow state transitions for each issue
          type.
        </p>
      </SectionMessage>

      {isSupported && (
        <Stack>
          <Stack space="space.025">
            <Label htmlFor="commentsEnabledToggle">
              Issue Status Helper is enabled for this project
            </Label>
            <Toggle
              key={id}
              isChecked={isSupported}
              onChange={() =>
                onSupportedChange({ projectId: id, isSupported: !isSupported })
              }
              label={`${id} (${key})`}
              value={id}
              name="project"
            />
          </Stack>
          <ProjectDetails
            projectId={id}
            projectsLoaded={true}
            projectAdminView={true}
          />
        </Stack>
      )}
    </Stack>
  );
}

export default ProjectPage;
