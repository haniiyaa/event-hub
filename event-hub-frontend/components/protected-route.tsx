"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRequireAuth } from "@/providers/session-provider";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, pending } = useRequireAuth();

  useEffect(() => {
    if (!pending && !authenticated) {
      router.replace("/login");
    }
  }, [pending, authenticated, router]);

  if (pending || !authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
