import { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import Spinner from "@atlaskit/spinner";
import { Grid, Inline, Stack } from "@atlaskit/primitives";
import Image from "@atlaskit/image";
import Heading from "@atlaskit/heading";
import { IssueStatus, PreferredStatuses } from "../common/types";
import { SelectStatus } from "./SelectStatus";
import { OnStatusSelected } from "../types";

type IssueTypeStatusesProps = {
  issueTypeIconUrl?: string;
  issueTypeId: string;
  issueTypeName: string;
  statuses: IssueStatus[];
  storageKey: string;
};

export const IssueTypeStatuses = (props: IssueTypeStatusesProps) => {
  const [savedStatuses, setSavedStatuses] = useState<
    PreferredStatuses | undefined
  >(undefined);

  const { issueTypeId, issueTypeName, statuses, storageKey, issueTypeIconUrl } =
    props;

  useEffect(() => {
    invoke("loadData", {
      key: storageKey,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const loadedSavedStatuses: PreferredStatuses = response;

      // @ts-ignore - Need to trust the data
      if (loadedSavedStatuses === undefined) {
        // No data has been stored yet, no action
      } else {
        setSavedStatuses(loadedSavedStatuses);
      }
    });
  }, [issueTypeId]);

  const onStatusSelected: OnStatusSelected = ({ statusId, category }) => {
    const updatedCommonPreferredStatuses: PreferredStatuses = {
      ...savedStatuses,
      [category]: statusId,
    };

    setSavedStatuses(updatedCommonPreferredStatuses);
    invoke("saveData", {
      key: storageKey,
      value: updatedCommonPreferredStatuses,
    });
  };

  if (savedStatuses === undefined) {
    return <Spinner />;
  }

  // Unfortunately it is not possible for Custom UI to load images from the URLs provided in the REST API
  // responses. It is necessary to generate a URL using the product host domain rather than the api.atlassian.com
  // domain. performing this step will ensure that there are no broken images.
  let convertedImageUrl = undefined;
  if (issueTypeIconUrl) {
    const domain = window.location.ancestorOrigins[0];
    const imageUrl = new URL(issueTypeIconUrl);
    const suffix = imageUrl.pathname.split("/rest/api/")[1];
    if (suffix !== undefined) {
      convertedImageUrl = `${domain}/rest/api/${suffix}${imageUrl.search}`;
    } else {
      convertedImageUrl = issueTypeIconUrl;
    }
  }

  return (
    <Stack space="space.100">
      <Inline alignBlock="center" space="space.050">
        <Image style={{ height: 16 }} src={convertedImageUrl} />
        <Heading level="h400">{issueTypeName}</Heading>
      </Inline>
      <Grid templateColumns="1fr 1fr 1fr" gap="space.200">
        <SelectStatus
          categoryName="To Do"
          id="common_todo"
          label="'To Do' Status"
          statuses={statuses}
          preferredStatuses={savedStatuses}
          onStatusSelected={onStatusSelected}
          offerDefaultOption={true}
        />
        <SelectStatus
          categoryName="In Progress"
          id="common_inprogress"
          label="'In Progress' Status"
          statuses={statuses}
          preferredStatuses={savedStatuses}
          onStatusSelected={onStatusSelected}
          offerDefaultOption={true}
        />
        <SelectStatus
          categoryName="Done"
          id="common_done"
          label="'Done' Status"
          statuses={statuses}
          preferredStatuses={savedStatuses}
          onStatusSelected={onStatusSelected}
          offerDefaultOption={true}
        />
      </Grid>
    </Stack>
  );
};
