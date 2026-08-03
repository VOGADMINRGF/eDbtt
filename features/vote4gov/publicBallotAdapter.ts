export type Vote4GovPublicBallotHandoff = {
  status: "unavailable";
  label: "Public Ballot noch nicht freigegeben";
  publicHref: null;
  canWrite: false;
  adapter: "vog-public-ballot-unavailable-v1";
};

/**
 * PR #557 is the sole owner of public-ballot release, eligibility, security,
 * persistence and write semantics. Until it is merged and centrally adapted,
 * the contextual topic handoff exposes no mutation or simulated success path.
 */
export function getVote4GovPublicBallotHandoff(): Vote4GovPublicBallotHandoff {
  return {
    status: "unavailable",
    label: "Public Ballot noch nicht freigegeben",
    publicHref: null,
    canWrite: false,
    adapter: "vog-public-ballot-unavailable-v1",
  };
}
