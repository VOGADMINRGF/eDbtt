export type HeaderAuthTruth<User> =
  | { status: "unknown"; user: undefined }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: User };

export function resolveHeaderAuthTruth<User>(params: {
  initialUser: User | null | undefined;
  currentUser: User | null;
  currentUserLoading: boolean;
}): HeaderAuthTruth<User> {
  const effectiveUser = params.currentUserLoading ? params.initialUser : params.currentUser;
  if (effectiveUser === undefined) return { status: "unknown", user: undefined };
  if (effectiveUser === null) return { status: "guest", user: null };
  return { status: "authenticated", user: effectiveUser };
}
