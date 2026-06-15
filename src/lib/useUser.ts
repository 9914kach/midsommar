"use client";

import { useEffect, useState } from "react";
import type { Role } from "./roles";
import { hasRole } from "./roles";

function getCookie(name: string): string {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

type User = { id: string; username: string; role: Role; is: (r: Role) => boolean };

const EMPTY: User = { id: "", username: "", role: "gäst", is: (r) => hasRole("gäst", r) };

export function useUser(): User {
  const [user, setUser] = useState<User>(EMPTY);

  useEffect(() => {
    const id = getCookie("midsommar_user_id_pub");
    const username = getCookie("midsommar_username");
    const role = (getCookie("midsommar_role") || "gäst") as Role;
    setUser({ id, username, role, is: (r) => hasRole(role, r) });
  }, []);

  return user;
}
