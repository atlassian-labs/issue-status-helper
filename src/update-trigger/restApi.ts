import api, { route, storage } from "@forge/api";
import {
  AddCommentToIssue,
  CallRestApi,
  CustomFieldSearchResults,
  FetchCustomField,
  FetchIssue,
  FetchIssueTransitions,
  FetchSprint,
  FetchStatus,
  Issue,
  IssueTransitions,
  JqlSearchResults,
  MakeGetRestApiCall,
  MakePostRestApiCall,
  MakePutRestApiCall,
  NoContentResponseData,
  RestApiResponse,
  SearchWithJql,
  Sprint,
  TransitionIssue,
  UpdateIssueCustomField,
} from "./types";
import { IssueStatus } from "../../static/admin-page/src/common/types";

const callRestApi: CallRestApi<object> = async ({
  requestUrl,
  method,
  body,
}) => {
  let response = await api.asApp().requestJira(requestUrl, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    // A 204 response indicated that there was no content
    const restApiResponse: RestApiResponse<NoContentResponseData> = {
      status: 204,
      statusText: response.statusText,
      data: {},
    };
    return restApiResponse;
  }
  // The API call was a success, return the JSON body
  const restApiResponse: RestApiResponse<object> = {
    status: response.status,
    statusText: response.statusText,
    data: await response.json(),
  };
  return restApiResponse;
};

const makeGetApiCall: MakeGetRestApiCall<unknown> = async ({ requestUrl }) => {
  return callRestApi({ requestUrl, method: "GET" });
};

const makePostApiCall: MakePostRestApiCall<unknown> = async ({
  requestUrl,
  body,
}) => {
  return callRestApi({ requestUrl, method: "POST", body });
};

const makePutApiCall: MakePutRestApiCall<unknown> = async ({
  requestUrl,
  body,
}) => {
  return callRestApi({ requestUrl, method: "PUT", body });
};

export const fetchIssue: FetchIssue = async ({ issueIdOrKey }) => {
  return makeGetApiCall({
    requestUrl: route`/rest/api/2/issue/${issueIdOrKey}`,
  }) as Promise<RestApiResponse<Issue>>;
};

export const fetchIssueTransitions: FetchIssueTransitions = async ({
  issueIdOrKey,
}) => {
  return makeGetApiCall({
    requestUrl: route`/rest/api/2/issue/${issueIdOrKey}/transitions`,
  }) as Promise<RestApiResponse<IssueTransitions>>;
};

export const transitionIssue: TransitionIssue = ({
  issueIdOrKey,
  transitionId,
}) => {
  const body = {
    transition: {
      id: transitionId,
    },
  };

  return makePostApiCall({
    requestUrl: route`/rest/api/2/issue/${issueIdOrKey}/transitions`,
    body,
  }) as Promise<RestApiResponse<NoContentResponseData>>;
};

export const updateIssueCustomField: UpdateIssueCustomField = async ({
  issueIdOrKey,
  customFields,
}) => {
  const requestUrl = route`/rest/api/3/issue/${issueIdOrKey}`;

  const fields = customFields.reduce((accumulator, customField) => {
    const { id, value } = customField;
    return { ...accumulator, [`${id}`]: value };
  }, {});

  const body = {
    fields,
  };
  const response = await makePutApiCall({ requestUrl, body });
  return response;
};

export const addCommentToIssue: AddCommentToIssue = async ({
  issueIdOrKey,
  comment,
}) => {
  const requestUrl = route`/rest/api/3/issue/${issueIdOrKey}/comment`;
  const body = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              text: comment,
              type: "text",
            },
          ],
        },
      ],
    },
  };

  const response = await makePostApiCall({ requestUrl, body });
  return response;
};

export const searchWithJql: SearchWithJql = async ({ jql }) => {
  return makeGetApiCall({
    requestUrl: route`/rest/api/2/search?jql=${jql}`,
  }) as Promise<RestApiResponse<JqlSearchResults>>;
};

export const fetchStatus: FetchStatus = async ({ statusId }) => {
  return makeGetApiCall({
    requestUrl: route`/rest/api/2/status/${statusId}`,
  }) as Promise<RestApiResponse<IssueStatus>>;
};

export const fetchCustomField: FetchCustomField = async ({ customFieldId }) => {
  return makeGetApiCall({
    requestUrl: route`/rest/api/3/field/search?id=${customFieldId}`,
  }) as Promise<RestApiResponse<CustomFieldSearchResults>>;
};

export const fetchSprint: FetchSprint = async ({ sprintId }) => {
  return makeGetApiCall({
    requestUrl: route`/rest/agile/1.0/sprint/${sprintId}`,
  }) as Promise<RestApiResponse<Sprint>>;
};
