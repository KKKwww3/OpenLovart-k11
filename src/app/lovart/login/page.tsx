"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const handleSuccess = useCallback(() => {
    router.push("/lovart");
  }, [router]);

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">配置错误：缺少 Supabase 配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <AuthForm supabase={supabase} onSuccess={handleSuccess} />
    </div>
  );
}
