import Heading from "@atlaskit/heading";
import { Stack, Box, xcss } from "@atlaskit/primitives";
import SectionMessage from "@atlaskit/section-message";
import Tabs, { TabList, Tab, TabPanel } from "@atlaskit/tabs";
import { CommonStatuses } from "./components/CommonStatuses";
import { ProjectList } from "./components/ProjectList";
import { StartAndEndFields } from "./components/StartAndEndFields";

const boxStyles = xcss({
  flexGrow: "1",
});

function AdminPage() {
  return (
    <Stack space="space.250">
      <SectionMessage title="Automatic issue status hierarchy transitions">
        <p>
          Select the projects that you want to enable for automatic issue
          transitions. When enabled the parent of an issue will automatically be
          updated to assigned status for each category. For example if all child
          issues are "DONE" then the parent issue will automatically be set to
          the configured status for the "DONE" status category.
        </p>
        <p>
          When an issue transitions between status categories you can enable
          setting start and end date fields to log when the change occurred.
        </p>
      </SectionMessage>
      <Tabs id="tab">
        <TabList>
          <Tab>Project Settings</Tab>
          <Tab>Global Settings</Tab>
          {/* <Tab>Comments Settings</Tab> */}
        </TabList>
        <TabPanel>
          <Box padding="space.250" xcss={boxStyles}>
            <Stack space="space.200">
              <Heading level="h700">Projects</Heading>
              <ProjectList />
            </Stack>
          </Box>
        </TabPanel>
        <TabPanel>
          <Box padding="space.250">
            <Stack space="space.200">
              <Heading level="h700">Status configurations</Heading>
              <CommonStatuses />
              <Heading level="h700">Date field configurations</Heading>
              <StartAndEndFields globalConfig={true} />
            </Stack>
          </Box>
        </TabPanel>
      </Tabs>
    </Stack>
  );
}

export default AdminPage;
