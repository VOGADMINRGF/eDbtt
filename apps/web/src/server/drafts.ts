import "server-only";

const RETIRED_WRITER_ERROR = "draft_writer_retired_use_saveUserScopedServerDraft";

export async function createDraft(_data: unknown) {
  throw new Error(RETIRED_WRITER_ERROR);
}

export async function patchDraft(_id: string, _patch: unknown) {
  throw new Error(RETIRED_WRITER_ERROR);
}
