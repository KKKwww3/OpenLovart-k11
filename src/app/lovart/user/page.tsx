'use client';

import React, { useEffect, useState } from 'react';
import { Coins, Calendar, Bell } from 'lucide-react';
import { useSupabase, INTERNAL_USER_ID } from '@/hooks/useSupabase';

interface UserCredits {
    user_id: string;
    credits: number;
    created_at: string;
    updated_at: string;
}

export default function UserPage() {
    const supabase = useSupabase();
    const [credits, setCredits] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUserCredits() {
            if (!supabase) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await (supabase as any)
                    .from('user_credits')
                    .select('*')
                    .eq('user_id', INTERNAL_USER_ID)
                    .single();

                if (error && error.code === 'PGRST116') {
                    const { data: newData, error: insertError } = await (supabase as any)
                        .from('user_credits')
                        .insert({
                            user_id: INTERNAL_USER_ID,
                            credits: 1000,
                        })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    setCredits(newData.credits);
                } else if (error) {
                    throw error;
                } else {
                    setCredits(data.credits);
                }
            } catch (error) {
                console.error('Failed to load user credits:', error);
                setCredits(1000);
            } finally {
                setIsLoading(false);
            }
        }

        loadUserCredits();
    }, [supabase]);

    return (
        <div className="h-screen bg-white text-gray-900 font-sans">
            <main className="h-full flex flex-col overflow-hidden">
                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">L</div>
                            <span className="text-lg font-semibold text-gray-900">Lovart</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                                <Bell size={18} className="text-gray-600" />
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            </button>

                            {credits !== null && (
                                <div className="px-3 py-1.5 bg-black text-white rounded-full text-xs font-medium flex items-center gap-1.5">
                                    <span className="text-sm">⚡</span>
                                    <span>{credits.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-8 pb-8">
                    <div className="max-w-4xl mx-auto">
                        {/* User Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    L
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">内部用户</h2>
                                    <p className="text-gray-500">internal@lovart.local</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Credits Card */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                            <Coins size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">积分</h3>
                                    </div>
                                    {isLoading ? (
                                        <p className="text-3xl font-bold text-gray-400">加载中...</p>
                                    ) : (
                                        <p className="text-4xl font-bold text-gray-900">{credits?.toLocaleString()}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-2">可用于生成图片和使用 AI 功能</p>
                                </div>

                                {/* Status Card */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                                            <Calendar size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">状态</h3>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">内部使用</p>
                                    <p className="text-sm text-gray-500 mt-2">公司内部版本</p>
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">关于积分</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>内部用户默认获得 <strong className="text-gray-900">1000 积分</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>使用 AI 图像生成功能会消耗积分</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>更多获取积分的方式即将推出</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
