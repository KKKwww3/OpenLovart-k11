-- ============================================================
-- prompt_templates: 提示词模板表
-- 用途：各功能块的提示词集中管理，支持随时在线修改
-- 管理员在 Supabase Dashboard 直接编辑 content 列即可生效
-- ============================================================

create table if not exists prompt_templates (
  id uuid not null default gen_random_uuid() primary key,
  module_key text not null,                -- 功能块标识，如 product-replace, white-background
  name text not null default '默认',        -- 提示词名称/版本
  content text not null,                    -- 提示词内容
  is_active boolean not null default true,  -- 是否启用
  sort_order integer not null default 0,    -- 排序权重
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 索引：按功能块查启用状态
create index if not exists idx_prompt_templates_module
  on prompt_templates (module_key, is_active, sort_order);

-- RLS
alter table prompt_templates enable row level security;

create policy "prompt_templates 公开可读"
  on prompt_templates for select
  using (true);

create policy "prompt_templates 仅认证用户可写"
  on prompt_templates for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 自动更新时间触发器
create or replace function update_prompt_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_prompt_templates_updated_at
  before update on prompt_templates
  for each row
  execute function update_prompt_templates_updated_at();

-- 预置数据：产品替换
insert into prompt_templates (module_key, name, content, sort_order) values
  ('product-replace', '默认替换', E'请帮我替换产品到场景中，保持场景中其他元素不变不变，只替换产品位置。严格要求：

1. 替换后的产品图案、颜色、材质、纹理必须与参考产品完全一致，不得修改、美化或风格化
2. 场景中除产品外的所有元素保持完全不变：家具、墙壁、窗户、光线、阴影、透视关系
3. 新产品自然贴合原产品位置和透视，边缘与地面无缝融合，保留家具脚压在产品上的真实阴影
4. 照片级真实感，无AI痕迹或合成伪影', 1);