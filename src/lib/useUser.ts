"use client";

import { useMemo } from "react";
import type { Role } from "./roles";
import { hasRole } from "./roles";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

export function useUser() {
  return useMemo(() => {
    const id = getCookie("midsommar_user_id_pub");
    const username = getCookie("midsommar_username");
    const role = (getCookie("midsommar_role") || "gäst") as Role;
    return {
      id,
      username,
      role,
      is: (r: Role) => hasRole(role, r),
    };
  }, []);
}
