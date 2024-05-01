import { auth } from "@clerk/nextjs";

const allowedIds = ["user_2e1N7i6cxpcpJ2wnJ4sx9HcnUxQ"];

export const isAdmin = () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  return allowedIds.indexOf(userId) !== -1;
};
