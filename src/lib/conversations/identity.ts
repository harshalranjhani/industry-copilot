/** The request header that carries the picked user's ID: the identity in every request. */
export const USER_HEADER = "x-copilot-user";

/** A person from the fleet's user list. */
export interface CopilotUser {
  userId: string;
  name: string;
  role: string;
  teamName?: string | null;
}
