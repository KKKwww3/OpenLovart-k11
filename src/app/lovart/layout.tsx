"use client";

import { useSupabase } from "@/hooks/useSupabase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LovartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (!supabase) {
        setIsChecking(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      const isLoginPage = pathname.startsWith("/lovart/login");

      if (!session && !isLoginPage) {
        router.replace("/lovart/login");
      } else if (session && isLoginPage) {
        router.replace("/lovart");
      } else {
        setIsChecking(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        checkAuth();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}