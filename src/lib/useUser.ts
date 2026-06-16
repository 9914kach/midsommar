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

function makeUser(id: string, username: string, role: Role): User {
  return { id, username, role, is: (r) => hasRole(role, r) };
}

export function useUser(): User {
  const [user, setUser] = useState<User>(EMPTY);

  useEffect(() => {
    const id = getCookie("midsommar_user_id_pub");
    const username = getCookie("midsommar_username");
    const realRole = (getCookie("midsommar_role") || "gäst") as Role;
    const simRole = (sessionStorage.getItem("simulate_role") || "") as Role;
    const role = simRole || realRole;
    if (id) setUser(makeUser(id, username, role));

    fetch("/api/me")
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (u) {
          const sim = (sessionStorage.getItem("simulate_role") || "") as Role;
          setUser(makeUser(u.id, u.username, (sim || u.role) as Role));
        }
      })
      .catch(() => {});
  }, []);

  return user;
}
