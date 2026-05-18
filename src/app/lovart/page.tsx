"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardSidebar } from "@/components/lovart/DashboardSidebar";
import { ProjectCard } from "@/components/lovart/ProjectCard";
import { useSupabase, INTERNAL_USER_ID } from "@/hooks/useSupabase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  thumbnail: string | null;
  updated_at: string;
}

export default function LovartDashboard() {
  const supabase = useSupabase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const [projectsResult, creditsResult] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .order("updated_at", { ascending: false }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("user_credits")
            .select("credits")
            .eq("user_id", INTERNAL_USER_ID)
            .single(),
        ]);

        if (projectsResult.error) throw projectsResult.error;
        setProjects(projectsResult.data || []);

        if (creditsResult.error && creditsResult.error.code === "PGRST116") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newData } = await (supabase as any)
            .from("user_credits")
            .insert({ user_id: INTERNAL_USER_ID, credits: 1000 })
            .select()
            .single();
          setCredits(newData?.credits || 1000);
        } else if (!creditsResult.error) {
          setCredits(creditsResult.data?.credits || 0);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "刚刚编辑";
    if (diffInMins < 60) return `${diffInMins} 分钟前编辑`;
    if (diffInHours < 24) return `${diffInHours} 小时前编辑`;
    if (diffInDays < 7) return `${diffInDays} 天前编辑`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <div className="h-screen bg-[#FAFAFA] text-gray-900 font-sans">
      <DashboardSidebar />

      <main className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
                L
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Lovart
              </span>
            </div>

            <div className="flex items-center gap-2">
              {credits !== null && (
                <div className="px-3 py-1.5 bg-black text-white rounded-full text-xs font-medium flex items-center gap-1.5">
                  <span className="text-sm">⚡</span>
                  <span>{credits.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-12">
            {/* 登录后显示的欢迎信息 停用 */}
            {/* <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold">
                  L
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Lovart 让设计更简单
                </h1>
              </div>
              <p className="text-gray-500 mb-8">
                输入想法即可生成，帮你完成一切
              </p>

              <div className="relative max-w-2xl mx-auto mb-6">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="让 Lovart 为你自动生成内容或效果图吧"
                  className="w-full px-6 py-4 pr-32 rounded-full bg-white shadow-sm focus:shadow-md outline-none transition-all text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputValue.trim()) {
                      handleGenerate();
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setInputValue("")}
                  >
                    <Sparkles size={20} className="text-gray-400" />
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!inputValue.trim() || isGenerating}
                    className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? "生成中..." : "生成"}
                  </button>
                </div>
              </div>
            </div> */}

            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  最近项目
                  {!isLoading && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({projects.length})
                    </span>
                  )}
                </h2>
                <Link
                  href="/lovart/projects"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  查看全部 →
                </Link>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400">加载中...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Link
                    href="/lovart/canvas"
                    className="group flex flex-col items-center justify-center aspect-[4/3] bg-white rounded-2xl hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                      <Plus size={24} className="text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-600">新建项目</span>
                  </Link>

                  {projects.slice(0, 3).map((project) => (
                    <Link
                      key={project.id}
                      href={`/lovart/canvas?id=${project.id}`}
                    >
                      <ProjectCard
                        title={project.title}
                        date={formatDate(project.updated_at)}
                        imageUrl={project.thumbnail || undefined}
                      />
                    </Link>
                  ))}
                </div>
              )}

              {projects.length === 0 && !isLoading && (
                <div className="text-center py-12 text-gray-400">
                  <p className="mb-2">还没有项目</p>
                  <p className="text-sm">点击 &quot;新建项目&quot; 开始创作！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
