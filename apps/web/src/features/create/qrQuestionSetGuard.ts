import {
  evaluatePublicQuestionGeneralization,
  type PublicQuestionActorContext,
  type PublicQuestionActorExtraction,
  type PublicQuestionGeneralizationResult,
} from "@/features/create/safety/publicQuestionGeneralization";

export function evaluateQrQuestionSetQuestion(input: {
  question: string;
  staffReviewerId?: string | null;
  actorContexts?: PublicQuestionActorContext[];
  actorExtraction?: PublicQuestionActorExtraction | null;
}): PublicQuestionGeneralizationResult {
  // Authentication identifies the requester, but is not evidence that actor
  // extraction or a separate content review actually happened.
  return evaluatePublicQuestionGeneralization({
    originalInput: input.question,
    candidatePublicQuestion: input.question,
    actorContexts: input.actorContexts ?? [],
    actorExtraction: input.actorExtraction ?? {
      status: "unverified",
      source: "not_available",
      independentFromCandidateProvider: false,
      evidenceRefs: [],
    },
  });
}
