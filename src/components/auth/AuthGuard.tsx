"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthGuardProps {
  supabase: SupabaseClient;
  children: React.ReactNode;
  onNotAuthenticated?: () => void;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  supabase,
  children,
  onNotAuthenticated,
  fallback,
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        onNotAuthenticated?.();
      }

      setIsLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        onNotAuthenticated?.();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, onNotAuthenticated]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2
              size={40}
              className="animate-spin text-gray-400 mx-auto mb-4"
            />
            <p className="text-gray-500">检查登录状态...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}

export function useAuth(supabase: SupabaseClient) {
  const [user, setUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || "" });
      }
      setIsLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, isLoading, signOut };
}
