import { useCallback, useEffect } from "react";

import { useChatData } from "../../../ChatContext";
import { getId } from "../../../utils/chatHelpers";

// Block / unblock the other user. Shared by the top bar menu and the blocked banner.
export const useBlockUser = (otherId) => {
  const { blockedUsers, handleGetBlockedUsers, handleBlockUser, handleUnblockUser } = useChatData();

  useEffect(() => {
    handleGetBlockedUsers();
  }, [handleGetBlockedUsers]);

  const isBlocked = !!blockedUsers?.some((u) => getId(u) === otherId);

  const block = useCallback(async () => {
    await handleBlockUser({ userId: otherId });
    handleGetBlockedUsers();
  }, [otherId, handleBlockUser, handleGetBlockedUsers]);

  const unblock = useCallback(async () => {
    await handleUnblockUser({ userId: otherId });
    handleGetBlockedUsers();
  }, [otherId, handleUnblockUser, handleGetBlockedUsers]);

  return { isBlocked, block, unblock };
};
