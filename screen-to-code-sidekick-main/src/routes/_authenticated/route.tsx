import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PinLock } from "@/components/PinLock";

export const AccountContext = createContext<{ email: string; displayName: string }>({
  email: "",
  displayName: "",
});

export function useAccount() {
  return useContext(AccountContext);
}

// Client-only gate: the session lives in localStorage, which SSR cannot read.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || (user.user_metadata?.["display_name"] as string) || "");
      });
  }, [user.id, user.user_metadata]);

  return (
    <PinLock userId={user.id}>
      <AccountContext.Provider value={{ email: user.email ?? "", displayName }}>
        <Outlet />
      </AccountContext.Provider>
    </PinLock>
  );
}

