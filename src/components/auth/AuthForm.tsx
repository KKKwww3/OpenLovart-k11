"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Loader2,
  LogIn,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthFormProps {
  supabase: SupabaseClient;
  onSuccess?: () => void;
  mode?: "login" | "signup";
}

export function AuthForm({
  supabase,
  onSuccess,
  mode = "login",
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState(mode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (currentMode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setMessage("注册成功！请检查您的邮箱以确认账户。");
        } else {
          setMessage("注册成功！正在跳转...");
          setTimeout(() => onSuccess?.(), 800);
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;

        if (data.session) {
          setMessage("登录成功！正在跳转...");
          setTimeout(() => onSuccess?.(), 800);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setCurrentMode(currentMode === "login" ? "signup" : "login");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentMode === "login" ? "欢迎回来" : "创建账户"}
          </h2>
          <p className="text-gray-500 mt-2">
            {currentMode === "login"
              ? "登录以继续使用电商图片工具"
              : "注册新账户开始使用"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              邮箱地址
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              密码
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : currentMode === "login" ? (
              <LogIn size={18} />
            ) : (
              <UserPlus size={18} />
            )}
            <span>
              {isLoading
                ? "处理中..."
                : currentMode === "login"
                  ? "登录"
                  : "注册"}
            </span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {currentMode === "login" ? (
              <>
                还没有账户？<span className="text-blue-500">立即注册</span>
              </>
            ) : (
              <>
                已有账户？<span className="text-blue-500">立即登录</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
