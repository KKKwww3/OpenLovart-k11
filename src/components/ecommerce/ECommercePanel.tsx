"use client";

import React, { useState } from "react";
import {
  Image,
  RotateCcw,
  User,
  ZoomIn,
  Layout,
  Users,
  Square,
  Video,
  X,
  ChevronDown,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ProductReplaceModule } from "./ProductReplaceModule-mod/ProductReplaceModule";
import { MultiAngleModule } from "./MultiAngleModule";
import { ModelGenerationModule } from "./ModelGenerationModule";
import { CloseUpModule } from "./CloseUpModule";
import { DetailTemplateModule } from "./DetailTemplateModule";
import { BuyerShowModule } from "./BuyerShowModule";
import { WhiteBackgroundModule } from "./WhiteBackgroundModule";
import { MainVideoModule } from "./MainVideoModule";

export interface ECommercePanelProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  onAddVideoToCanvas?: (videoUrl: string, x?: number, y?: number) => void;
  onClose?: () => void;
  supabase?: SupabaseClient;
}

interface ModuleTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const MODULE_TABS: ModuleTab[] = [
  {
    id: "product-replace",
    name: "产品替换",
    icon: <Image size={16} />,
    description: "场景批量替换产品",
  },
  {
    id: "multi-angle",
    name: "多角度",
    icon: <RotateCcw size={16} />,
    description: "生成7个角度",
  },
  {
    id: "model-generation",
    name: "模特生成",
    icon: <User size={16} />,
    description: "添加模特展示",
  },
  {
    id: "close-up",
    name: "近景图",
    icon: <ZoomIn size={16} />,
    description: "细节特写展示",
  },
  {
    id: "detail-template",
    name: "详情页",
    icon: <Layout size={16} />,
    description: "详情页套版",
  },
  {
    id: "buyer-show",
    name: "买家秀",
    icon: <Users size={16} />,
    description: "真实买家风格",
  },
  {
    id: "white-background",
    name: "白底图",
    icon: <Square size={16} />,
    description: "电商主图白底",
  },
  {
    id: "main-video",
    name: "主图视频",
    icon: <Video size={16} />,
    description: "产品展示视频",
  },
];

export function ECommercePanel({
  onAddToCanvas,
  onAddVideoToCanvas,
  onClose,
  supabase,
}: ECommercePanelProps) {
  const [activeTab, setActiveTab] = useState("product-replace");
  const [showModuleMenu, setShowModuleMenu] = useState(false);

  const currentModule = MODULE_TABS.find((m) => m.id === activeTab);

  const renderModule = () => {
    switch (activeTab) {
      case "product-replace":
        return <ProductReplaceModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "multi-angle":
        return <MultiAngleModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "model-generation":
        return <ModelGenerationModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "close-up":
        return <CloseUpModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "detail-template":
        return <DetailTemplateModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "buyer-show":
        return <BuyerShowModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "white-background":
        return <WhiteBackgroundModule onAddToCanvas={onAddToCanvas} supabase={supabase} />;
      case "main-video":
        return (
          <MainVideoModule
            onAddToCanvas={onAddVideoToCanvas || onAddToCanvas}
            supabase={supabase}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Image size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">电商图片工具</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <button
            onClick={() => setShowModuleMenu(!showModuleMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{currentModule?.icon}</span>
              <span className="text-gray-700 font-medium">
                {currentModule?.name}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showModuleMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 max-h-[300px] overflow-y-auto">
              {MODULE_TABS.map((module) => (
                <div
                  key={module.id}
                  onClick={() => {
                    setActiveTab(module.id);
                    setShowModuleMenu(false);
                  }}
                  className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeTab === module.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        activeTab === module.id
                          ? "text-blue-500"
                          : "text-gray-500"
                      }
                    >
                      {module.icon}
                    </span>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          activeTab === module.id
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {module.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {module.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">{renderModule()}</div>

      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MODULE_TABS.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveTab(module.id)}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeTab === module.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {module.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
