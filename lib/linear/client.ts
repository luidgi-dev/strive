// Linear API client (LUI-91) — server-only.
//
// Creates an issue in the Strive workspace from a feedback submission. Uses the
// GraphQL API with the server-side LINEAR_API_KEY (never exposed to the client).
// Throws on any failure so the caller can decide how to degrade (the feedback
// row is already persisted; the caller reports the failure to Sentry).

import "server-only";

import {
  LINEAR_ASSIGNEE_ID,
  LINEAR_MILESTONE_ID,
  LINEAR_PROJECT_ID,
  LINEAR_TEAM_ID,
} from "./config";

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

const CREATE_ISSUE_MUTATION = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        url
      }
    }
  }
`;

export type CreatedLinearIssue = { id: string; url: string };

type IssueCreateResponse = {
  data?: {
    issueCreate?: {
      success: boolean;
      issue?: { id: string; url: string } | null;
    };
  };
  errors?: { message: string }[];
};

export async function createLinearIssue(params: {
  title: string;
  description: string;
  labelId: string;
}): Promise<CreatedLinearIssue> {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LINEAR_API_KEY");
  }

  const res = await fetch(LINEAR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CREATE_ISSUE_MUTATION,
      variables: {
        input: {
          teamId: LINEAR_TEAM_ID,
          projectId: LINEAR_PROJECT_ID,
          projectMilestoneId: LINEAR_MILESTONE_ID,
          assigneeId: LINEAR_ASSIGNEE_ID,
          title: params.title,
          description: params.description,
          labelIds: [params.labelId],
        },
      },
    }),
    // Never cache a mutation.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Linear API HTTP ${res.status}`);
  }

  const json = (await res.json()) as IssueCreateResponse;
  if (json.errors?.length) {
    throw new Error(`Linear API error: ${json.errors[0].message}`);
  }

  const result = json.data?.issueCreate;
  if (!result?.success || !result.issue) {
    throw new Error("Linear issueCreate returned no issue");
  }

  return { id: result.issue.id, url: result.issue.url };
}
