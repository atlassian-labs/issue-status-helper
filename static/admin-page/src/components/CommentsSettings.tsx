import { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import { Inline, Stack } from "@atlaskit/primitives";
import Spinner from "@atlaskit/spinner";
import Toggle from "@atlaskit/toggle";
import { COMMENTS_SETTINGS_STORAGE_KEY } from "../common/constants";
import { CommentPreferences } from "../common/types";

type CommentsSettingsProps = {};

type OnToggleGlobalComments = (args: { enabled: boolean }) => void;

export const CommentsSettings = (props: CommentsSettingsProps) => {
  const [commentPreferences, setCommentPreferences] = useState<
    CommentPreferences | undefined
  >();

  useEffect(() => {
    invoke("loadData", {
      key: COMMENTS_SETTINGS_STORAGE_KEY,
    }).then((response) => {
      // TODO: Need to create properly typed resolvers
      // @ts-ignore
      const storedCommentPreferences: CommentPreferences = response;

      // @ts-ignore - Need to trust the data
      if (storedCommentPreferences === undefined) {
        // No data has been stored yet, no action
        setCommentPreferences({ commentsEnabled: true });
      } else {
        setCommentPreferences(storedCommentPreferences);
      }
    });
  }, []);

  const onToggleGlobalComments: OnToggleGlobalComments = ({ enabled }) => {
    const updatedCommentPreferences: CommentPreferences = {
      ...commentPreferences,
      commentsEnabled: enabled,
    };
    setCommentPreferences(updatedCommentPreferences);
    invoke("saveData", {
      key: COMMENTS_SETTINGS_STORAGE_KEY,
      value: updatedCommentPreferences,
    });
  };

  if (commentPreferences === undefined) {
    return <Spinner />;
  }

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <span>Comment on issues when making updates?</span>
        <Toggle
          isChecked={commentPreferences.commentsEnabled}
          onChange={() =>
            onToggleGlobalComments({
              enabled: !commentPreferences.commentsEnabled,
            })
          }
          label={`Enable comments`}
          name="project"
        />
      </Inline>
    </Stack>
  );
};
