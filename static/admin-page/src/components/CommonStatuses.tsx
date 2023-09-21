import { useEffect, useState } from "react";
import { invoke, requestJira } from "@forge/bridge";
import { Inline, Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import { IssueStatus, PreferredStatuses } from "../common/types";
import { COMMON_PREFERRED_STATUSES_STORAGE_KEY } from "../common/constants";
import { SelectStatus } from "./SelectStatus";
import { OnStatusSelected } from "../types";

type CommonStatusesProps = {};

export const CommonStatuses = (props: CommonStatusesProps) => {
  const [statuses, setStatuses] = useState<IssueStatus[] | undefined>();
  const [commonPreferredStatuses, setCommonPreferredStatuses] = useState<
    PreferredStatuses | undefined
  >();

  useEffect(() => {
    requestJira("/rest/api/2/status")
      .then((response) => response.json())
      .then((responseBody) => {
        const statuses = responseBody as IssueStatus[];

        const filteredStatuses = statuses.filter(
          (status) => status.scope === undefined
        );
        setStatuses(filteredStatuses);
      });
  }, []);

  useEffect(() => {
    invoke("loadData", {
      key: COMMON_PREFERRED_STATUSES_STORAGE_KEY,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const storedCommonPreferredStatuses: PreferredStatuses = response;

      // @ts-ignore - Need to trust the data
      if (storedCommonPreferredStatuses === undefined) {
        // No data has been stored yet, no action
      } else {
        setCommonPreferredStatuses(storedCommonPreferredStatuses);
      }
    });
  }, []);

  const onStatusSelected: OnStatusSelected = ({ statusId, category }) => {
    const updatedCommonPreferredStatuses: PreferredStatuses = {
      ...commonPreferredStatuses,
      [category]: statusId,
    };

    setCommonPreferredStatuses(updatedCommonPreferredStatuses);
    invoke("saveData", {
      key: COMMON_PREFERRED_STATUSES_STORAGE_KEY,
      value: updatedCommonPreferredStatuses,
    });
  };

  if (commonPreferredStatuses === undefined || statuses === undefined) {
    return <Spinner />;
  }

  return (
    <Stack space="space.200">
      <SelectStatus
        categoryName="To Do"
        id="common_todo"
        label="Default 'To Do' Status"
        statuses={statuses}
        preferredStatuses={commonPreferredStatuses}
        onStatusSelected={onStatusSelected}
      />
      <SelectStatus
        categoryName="In Progress"
        id="common_inprogress"
        label="Default 'In Progress' Status"
        statuses={statuses}
        preferredStatuses={commonPreferredStatuses}
        onStatusSelected={onStatusSelected}
      />
      <SelectStatus
        categoryName="Done"
        id="common_done"
        label="Default 'Done' Status"
        statuses={statuses}
        preferredStatuses={commonPreferredStatuses}
        onStatusSelected={onStatusSelected}
      />
    </Stack>
  );
};
