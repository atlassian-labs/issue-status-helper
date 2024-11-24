export type SupportedProject = {
  id: string;
  isSupported: boolean;
};

export type SupportedProjects = {
  [key: string]: SupportedProject;
};

export type ProjectPreferences = {
  commentsEnabled?: boolean;
  sprintDatesEnabled?: boolean;
  childMinMaxDatesEnabled?: boolean;
  shrinkParentEnabled?: boolean;
  dateFieldsEnabled?: boolean;
  startFieldId?: string;
  endFieldId?: string;
};

export type PreferredStatuses = {
  "To Do"?: string;
  "In Progress"?: string;
  Done?: string;
};

export type CommentPreferences = {
  commentsEnabled: boolean;
};

export type PreferredDateFields = {
  enabled?: boolean;
  START?: string;
  END?: string;
};

export type IssueStatusCategoryName = "To Do" | "In Progress" | "Done";

export type IssueStatusCategory = {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: IssueStatusCategoryName;
};

export type IssueStatus = {
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: IssueStatusCategory;
  scope?: {
    type: string;
    project: {
      id: string;
    };
  };
};

export type ProjectSearchResults = {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Project[];
};

export type Project = {
  id: string;
  key: string;
  name: string;
  isPrivate: boolean;
  projectTypeKey: "business" | "software" | "product_discovery";
  simplified: boolean;
  style: "classic" | "next-gen";
  avatarUrls: {
    "16x16": string;
    "24x24": string;
    "32x32": string;
    "48x48": string;
  };
};

export type CustomField = {
  id: string;
  name: string;
  schema: {
    type: string;
    custom: string;
    customId: number;
  };
  description: string;
};
