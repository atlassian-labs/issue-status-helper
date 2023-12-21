import { requestJira, invoke } from "@forge/bridge";
import { ChangeEvent, useEffect, useState } from "react";
import { SUPPORTED_PROJECTS_STORAGE_KEY } from "../common/constants";
import {
  SupportedProjects,
  SupportedProject,
  ProjectSearchResults,
} from "../common/types";
import { Project, UpdateSupportedProject } from "../types";
import { ProjectSummary } from "./ProjectSummary";
import { Box, Grid, Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import Pagination from "@atlaskit/pagination";
import { ProjectDetails } from "./ProjectDetails";
import { Label } from "@atlaskit/form";
import TextField from "@atlaskit/textfield";
import { useDebounce } from "../hooks/useDebounce";

export const ProjectList = () => {
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [projectSearchResults, setProjectSearchResults] = useState<
    ProjectSearchResults | undefined
  >();
  const [supportedProjects, setSupportedProjects] = useState<
    SupportedProjects | undefined
  >(undefined);
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce<string>(query, 500);

  const maxResults = 20;

  useEffect(() => {
    const startAt = (pageNumber - 1) * maxResults;

    requestJira(
      `/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}&typeKey=software&query=${query}`
    )
      .then((response) => response.json())
      .then((responseBody) => {
        const searchResults = responseBody as ProjectSearchResults;
        const projects = responseBody.values as Project[];

        setProjectSearchResults({
          ...searchResults,
          values: projects,
        });
      });
  }, [debouncedQuery, pageNumber]);

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

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

  if (projectSearchResults === undefined || supportedProjects === undefined) {
    return <Spinner />;
  }

  const numberOfPages = Math.ceil(projectSearchResults.total / maxResults);
  const pageNumbers = Array.from({ length: numberOfPages }, (_, i) => i + 1);

  const projectsList = projectSearchResults.values.map((project) => {
    const { id } = project;
    const supportedProject = supportedProjects[id];
    const isSupported =
      supportedProject !== undefined ? supportedProject.isSupported : false;
    return (
      <ProjectSummary
        key={id}
        project={project}
        isSupported={isSupported}
        selectedProject={selectedProject}
        onSupportedChange={onSupportedChange}
        setSelectedProject={setSelectedProject}
      />
    );
  });
  return (
    <Grid templateColumns="1fr 2fr" gap="space.500">
      <Box>
        <Stack space="space.100">
          <Box>
            <Label htmlFor="project_query_field">Project filter</Label>
            <TextField
              id="project_query_field"
              placeholder="Enter project key or name to filter list..."
              onChange={handleChange}
            ></TextField>
          </Box>
          {projectsList}
          <Pagination
            pages={pageNumbers}
            onChange={(evt, page) => {
              setPageNumber(page);
            }}
          ></Pagination>
        </Stack>
      </Box>
      <Box>
        <ProjectDetails
          project={selectedProject}
          projectsLoaded={projectSearchResults !== undefined}
        />
      </Box>
    </Grid>
  );
};
