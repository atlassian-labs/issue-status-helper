import React from "react";
import Button from "@atlaskit/button/standard-button";
import Toggle from "@atlaskit/toggle";
import Image from "@atlaskit/image";

import { Project, UpdateSupportedProject } from "../types";
import { Box, Inline, xcss } from "@atlaskit/primitives";

type ProjectSummaryProps = {
  isSupported: boolean;
  project: Project;
  onSupportedChange: UpdateSupportedProject;
  selectedProject: Project | undefined;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | undefined>>;
};

const boxStyles = xcss({
  borderColor: "color.border",
  borderStyle: "solid",
  borderRadius: "border.radius.200",
  borderWidth: "border.width",
});

const selectedBoxStyles = xcss({
  borderColor: "color.border.selected",
  borderStyle: "solid",
  borderRadius: "border.radius.200",
  borderWidth: "border.width",
  backgroundColor: "color.background.selected",
});

export const ProjectSummary = (props: ProjectSummaryProps) => {
  const {
    isSupported,
    project,
    onSupportedChange,
    setSelectedProject,
    selectedProject,
  } = props;
  const { id, name, key } = project;

  const onClick = (project: Project) => {
    setSelectedProject(project);
  };

  const xcss =
    project.id === selectedProject?.id ? selectedBoxStyles : boxStyles;

  // Unfortunately it is not possible for Custom UI to load images from the URLs provided in the REST API
  // responses. It is necessary to generate a URL using the product host domain rather than the api.atlassian.com
  // domain. performing this step will ensure that there are no broken images.
  const domain = window.location.ancestorOrigins[0];
  const imageUrl = new URL(project.avatarUrls["24x24"]);
  const conertedImageUrl = `${domain}/rest/api/${
    imageUrl.pathname.split("/rest/api/")[1]
  }${imageUrl.search}`;

  return (
    <Box xcss={xcss} padding="space.075">
      <Inline alignBlock="center" spread="space-between">
        <Inline space="space.100" alignBlock="center">
          <Image style={{ height: 16 }} src={conertedImageUrl}></Image>
          <Button
            appearance="subtle-link"
            spacing="none"
            onClick={() => onClick(project)}
          >{`${name} (${key})`}</Button>
        </Inline>
        <Toggle
          key={id}
          isChecked={isSupported}
          onChange={() =>
            onSupportedChange({ projectId: id, isSupported: !isSupported })
          }
          label={`${name} (${key})`}
          value={id}
          name="project"
        />
      </Inline>
    </Box>
  );
};
