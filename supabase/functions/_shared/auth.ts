import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function createOptionsResponse(): Response {
  return new Response("ok", { headers: corsHeaders });
}

export function createErrorResponse(
  error: string,
  status: number = 401,
): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createJsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function authenticateUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header",
    };
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (!token) {
    return {
      success: false,
      error: "Invalid Authorization header format",
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return {
        success: false,
        error: `Authentication failed: ${error.message}`,
      };
    }
    
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || "",
        role: user.user_metadata?.role || "authenticated",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Authentication error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const authResult = await authenticateUser(req);
  
  if (!authResult.success) {
    throw new Error(authResult.error || "Authentication required");
  }
  
  return authResult.user!;
}

export function getServiceSupabase() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function getUserCredits(userId: string): Promise<number> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      const { data: newData, error: insertError } = await supabase
        .from("user_credits")
        .insert({ user_id: userId, credits: 100 })
        .select("credits")
        .single();
      
      if (insertError) {
        throw new Error(`Failed to create user credits: ${insertError.message}`);
      }
      
      return newData.credits;
    }
    throw new Error(`Failed to get user credits: ${error.message}`);
  }
  
  return data.credits;
}

export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const supabase = getServiceSupabase();
  
  const currentCredits = await getUserCredits(userId);
  
  if (currentCredits < amount) {
    return false;
  }
  
  const { error } = await supabase
    .from("user_credits")
    .update({ 
      credits: currentCredits - amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }
  
  return true;
}
