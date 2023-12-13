import { useEffect, useState } from "react";
import { view } from "@forge/bridge";
import { FullContext } from "./types";
import AdminPage from "./AdminPage";
import ProjectPage from "./ProjectPage";

function ModuleRouter() {
  const [context, setContext] = useState<FullContext | undefined>();

  view.theme.enable();
  useEffect(() => {
    // Use the "view" from Forge Bridge to get the context where this React app is running
    // @ts-ignore
    view.getContext().then(setContext);
  }, []);

  if (context === undefined) {
    return <div>Detecting context...</div>;
  }

  // Detect the module which calling this React app,
  // and render the content for that
  switch (context.moduleKey) {
    case "issue-status-helper-admin-page":
      return <AdminPage />;
    case "issue-status-helper-project-page":
      const extensionContext = context.extension;
      if (extensionContext) {
        return <ProjectPage extensionContext={extensionContext} />;
      }
      return <div>Extension Context Not Found</div>;
    default:
      return <div>Cannot Detect Context</div>;
  }
}

export default ModuleRouter;
