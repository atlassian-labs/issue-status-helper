import { Route } from "@forge/api";
import {
  CustomField,
  IssueStatus,
  IssueStatusCategoryName,
  PreferredStatuses,
  Project,
} from "../../static/admin-page/src/common/types";

export type ChangeLogItem = {
  field: string;
  fieldtype: string;
  fieldId?: string;
  from: unknown;
  fromString: string | null;
  to: unknown;
  toString: string | null;
};

export type UpdateEvent = {
  issue: {
    id: string;
    key: string;
    fields: {
      summary: string;
      issueType: object;
      creator: object;
      created: string;
      project: object;
      reporter: object;
    };
  };
  associatedUsers: [
    {
      accountId: string;
    }
  ];
  atlassianId: string;
  changelog: { id: string; items: ChangeLogItem[] };
  eventType: string;
};

export type RestApiMethod = "POST" | "GET" | "PUT";

export type NoContentResponseData = {};

export type RestApiResponse<T> = {
  status: number;
  statusText: string;
  data: T;
};

export type CallRestApi<T> = (args: {
  requestUrl: Route;
  method: RestApiMethod;
  body?: Object;
  //   successCode: number;
}) => Promise<RestApiResponse<T>>;

export type MakeGetRestApiCall<T> = (args: {
  requestUrl: Route;
}) => Promise<RestApiResponse<T>>;

export type MakePostRestApiCall<T> = (args: {
  requestUrl: Route;
  body: Object;
}) => Promise<RestApiResponse<T>>;

export type MakePutRestApiCall<T> = (args: {
  requestUrl: Route;
  body: Object;
}) => Promise<RestApiResponse<T>>;

export type FetchIssue = (args: {
  issueIdOrKey: string;
}) => Promise<RestApiResponse<Issue>>;

export type IssueTransition = {
  id: string;
  name: string;
  to: IssueStatus;
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isAvailable: boolean;
  isConditional: boolean;
  isLooped: boolean;
};

export type IssueTransitions = {
  expand: string;
  transitions: IssueTransition[];
};

export type FetchIssueTransitions = (args: {
  issueIdOrKey: string;
}) => Promise<RestApiResponse<IssueTransitions>>;

export type TransitionIssue = (args: {
  issueIdOrKey: string;
  transitionId: string;
}) => Promise<RestApiResponse<NoContentResponseData>>;

export type AddCommentToIssueData = any;

export type AddCommentToIssue = (args: {
  issueIdOrKey: string;
  comment: string;
}) => Promise<RestApiResponse<AddCommentToIssueData>>;

export type JqlSearchResults = {
  startAt: number;
  maxResults: number;
  total: number;
  issues: Issue[];
};
export type SearchWithJql = (args: {
  jql: string;
}) => Promise<RestApiResponse<JqlSearchResults>>;

export type IssueType = any;
export type ParentFields = any;

export type Issue = {
  id: string;
  key: string;
  fields: {
    issuetype: IssueType;
    parent?: {
      id: string;
      key: string;
      fields: ParentFields;
    };
    project: Project;
    summary: string;
    status: IssueStatus;
    customfield_10020?: Sprint[];
  };
};

export type SprintState = "closed" | "active" | "future";

export type Sprint = {
  id: number;
  self: string;
  endDate?: string;
  originBoardId: number;
  name: string;
  state: SprintState;
  goal?: string;
  completeDate?: string;
  startDate?: string;
};

export type ShouldProcessIssueUpdate = (args: {
  changelogItems: ChangeLogItem[];
}) => boolean;

export type GetParentChangeLogItem = (args: {
  changelogItems: ChangeLogItem[];
}) => ChangeLogItem | undefined;

export type GetSprintChangeLogItem = (args: {
  changelogItems: ChangeLogItem[];
}) => ChangeLogItem | undefined;

export type GenerateProjectIssueTypeStatusesStorageKey = (args: {
  projectId: string;
  issueTypeId: string;
}) => string;

export type GenerateProjectPreferencesStorageKey = (args: {
  projectId: string;
}) => string;

export type IsProjectSupported = (args: {
  issueId: string;
  projectId: string;
}) => Promise<boolean>;

export type GetChildIssueStatusCategories = (args: {
  parentKey: string;
  project: Project;
}) => Promise<IssueStatusCategoryName[]>;

export type AreAllChildrenToDo = (args: {
  childStatusCategories: IssueStatusCategoryName[];
}) => boolean;

export type AreSomeChildrenInProgressOrDone = (args: {
  childStatusCategories: IssueStatusCategoryName[];
}) => boolean;

export type AreAllChildrenDone = (args: {
  childStatusCategories: IssueStatusCategoryName[];
}) => boolean;

export type TransitionIssueWithComment = (args: {
  issue: Issue;
  comment: string;
  issueStatusCategoryName: IssueStatusCategoryName;
}) => Promise<void>;

export type FindPreferredStatusId = (args: {
  issueId: string;
  issueStatusCategoryName: string;
  defaultPeferredStatuses: PreferredStatuses | undefined;
  specificPreferredStatuses: PreferredStatuses | undefined;
}) => string | undefined;

export type UpdateIssueCustomField = (args: {
  issueIdOrKey: string;
  customFields: Array<{
    id: string;
    value: any;
  }>;
}) => Promise<RestApiResponse<unknown>>;

export type FetchStatus = (args: {
  statusId: string;
}) => Promise<RestApiResponse<IssueStatus>>;

export type CustomFieldSearchResults = {
  maxRessults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: CustomField[];
};

export type FetchCustomField = (args: {
  customFieldId: string;
}) => Promise<RestApiResponse<CustomFieldSearchResults>>;

export type FetchSprint = (args: {
  sprintId: number;
}) => Promise<RestApiResponse<Sprint>>;

export type UpdateIssueStartAndEndDatesForTransition = (args: {
  currentStatusCategoryName: IssueStatusCategoryName;
  targetStatusCategoryName: IssueStatusCategoryName;
  issueIdOrKey: string;
  projectId: string;
  sprint?: Sprint;
  preferredDateFields?: DateFields;
}) => Promise<void>;

export type GetCustomField = (args: {
  customFieldId: string;
}) => Promise<CustomField | undefined>;

export type UpdateParentStatus = (args: {
  parentId: string;
  project: Project;
  issue: Issue;
  preferredDateFields?: DateFields;
}) => void;

export type UpdateIssueStartAndEndDatesForSprintAssignment = (args: {
  issueIdOrKey: string;
  projectId: string;
  sprint: Sprint | undefined;
  statusCategoryName: IssueStatusCategoryName;
  preferredDateFields?: DateFields;
}) => void;

export type StartAndEndDates = {
  startDate: string | null;
  endDate: string | null;
};

export type GetSprintStartAndEndDates = (args: {
  sprint: Sprint | undefined;
}) => StartAndEndDates;

export type DateFields = {
  startFieldId: string;
  endFieldId: string;
  startFieldName: string;
  endFieldName: string;
};

export type GetPreferredDateFields = (args: {}) => Promise<
  DateFields | undefined
>;

export type DatesToSet = "NONE" | "BOTH" | "START" | "END";

export type UpdateDatesWithComment = (args: {
  issueIdOrKey: string;
  projectId: string;
  startFieldId: string;
  endFieldId: string;
  startDate: string | null;
  endDate: string | null;
  datesToSet: DatesToSet;
  comment: string;
}) => void;

export type AddComment = (args: {
  issueIdOrKey: string;
  projectId: string;
  comment: string;
}) => void;

export type MinMaxDates = {
  earliestStartString: string | null;
  latestEndString: string | null;
  hasIncompleteChildren: boolean;
};

export type GetMinMaxChildDates = (args: {
  parentKey: string;
  startFieldId: string;
  endFieldId: string;
}) => Promise<MinMaxDates | undefined>;

export type GetParentMinMaxDateValues = (args: {
  issueIdOrKey: string;
  projectId: string;
  preferredDateFields?: DateFields;
}) => Promise<MinMaxDates | undefined>;

export type GetStartAndEndDatesToSet = (args: {
  issueIdOrKey: string;
  projectId: string;
  preferredDateFields: DateFields;
  sprint?: Sprint;
}) => Promise<StartAndEndDates>;

export type SetParentMinMaxDates = (args: {
  parent: Issue;
  preferredDateFields?: DateFields;
}) => void;

export type GetParentMinMaxDatesToSet = (args: {
  earliestStart: number | undefined;
  latestEnd: number | undefined;
}) => DatesToSet | undefined;

export type StartOrEndDateFieldHasUpdated = (args: {
  changelogItems: ChangeLogItem[];
  preferredDateFields?: DateFields;
}) => boolean;
