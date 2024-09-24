import Resolver from "@forge/resolver";
import api, { authorize, requestJira, route, storage } from "@forge/api";
import { ProjectPermissionResponse } from "@forge/auth";

const resolver = new Resolver();

type SupportedProjects = {
  [key: string]: {
    id: string;
    isSupported: boolean;
  };
};

const verifyStoragePayloadAgainstUserPermissions = async (
  storageKey,
  storageData
): Promise<Object | null> => {
  // Check to see if the user is an instance admin...
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/mypermissions?permissions=ADMINISTER`);
  const myPermissions = await response.json();
  const isInstanceAdmin = myPermissions.permissions.ADMINISTER.havePermission;

  if (isInstanceAdmin) {
    // Instance admins can save any data, so no need to check further
    console.log(">> Instance admin can save data");
    return storageData;
  }

  // There are 2 different storage key formats that project admins can potentially update...
  // The first is the project preferences storage key, which is PROJECT:{projectId}-PREFERENCES
  // If the user is a project admin for the project then they can safely update the data.
  if (storageKey.startsWith("PROJECT:")) {
    const projectId = storageKey.split("-")[0].split(":")[1];
    const permissions: ProjectPermissionResponse[] = await authorize().onJira([
      {
        permissions: ["ADMINISTER_PROJECTS"],
        projects: [projectId],
      },
    ]);
    const isProjectAdmin =
      permissions.length > 0 &&
      permissions[0].projects &&
      permissions[0].projects.length > 0 &&
      permissions[0].projects[0].toString() === projectId;

    console.log(`Is project admin for ${projectId}?`, isProjectAdmin);
    if (isProjectAdmin) {
      return storageData;
    }

    // If the current user is NOT a project admin then we just return null to indicate that the
    // data should NOT be saved...
    return null;
  }
  // ...the second is the overall supported projects blob. Unfortunately this was established
  // before authorisation checks were enforced. So in this case we need to check each project
  // and update the storage data blob accordingly.
  else if (storageKey === "SUPPORTED_PROJECTS") {
    // Map the storage data for type safety and get the project keys that we need to check.
    // This will be the full list of configured projects, but the user may only have permission
    // to update some of them...
    const requestedSupportedProjects = storageData as SupportedProjects;
    const projectKeys = Object.keys(requestedSupportedProjects);

    // Use the authorize API to check the permissions for each project configured in the storage data.
    const permissions: ProjectPermissionResponse[] = await authorize().onJira([
      {
        permissions: ["ADMINISTER_PROJECTS"],
        projects: projectKeys,
      },
    ]);
    console.log(">> Project admin permissions", permissions);

    // Get the array of projects that the current user has permission to update. Then iterate over
    // them and update a new object containing only the projects that the user has permission to update.
    const editableProjectIds = permissions[0].projects || [];
    const projectsToUpdate: SupportedProjects = {};
    editableProjectIds.forEach((projectId) => {
      projectsToUpdate[projectId] = requestedSupportedProjects[projectId];
    });
    console.log(">> Projects that can be updated", projectsToUpdate);

    // Get the current persisted data and merge the new data into it. This ensures that only projects
    // that the user has permission to update are saved...
    const currentSupportedProjects = (await storage.get(
      "SUPPORTED_PROJECTS"
    )) as SupportedProjects;

    const dataToSave = {
      ...currentSupportedProjects,
      ...projectsToUpdate,
    };

    return dataToSave;
  }

  return null;
};

resolver.define("loadData", async ({ payload, context }) => {
  const data = await storage.get(payload.key);
  return data;
});

resolver.define("saveData", async ({ payload, context }) => {
  console.log("Save data request", payload.key, payload.value);
  const dataToSave = await verifyStoragePayloadAgainstUserPermissions(
    payload.key,
    payload.value
  );
  if (dataToSave === null) {
    console.log(
      ">> User does not have adequate permission to save data",
      payload.key,
      payload.value
    );
    return;
  }

  await storage.set(payload.key, payload.value);
});

export const handler = resolver.getDefinitions();
