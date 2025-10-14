//features/auth/components/withPageGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@features/user/context/UserContext";

export function withPageGuard<TProps extends {}>(
  Component: React.ComponentType<TProps>,
  allowedRoles: string[] = ["admin"]
) {
  return function Guarded(props: TProps) {
    const router = useRouter();
    const { role, loading } = useUser();

    useEffect(() => {
      if (!loading && !allowedRoles.includes(role)) {
        router.replace("/login?reason=forbidden");
      }
    }, [role, loading, router]);

    if (loading) return null; // oder Skeleton
    return <Component {...props} />;
  };
}
