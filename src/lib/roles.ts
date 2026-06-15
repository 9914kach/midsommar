import type { Role } from "./database.types";

export type { Role };

const LEVELS: Record<Role, number> = {
  gäst: 1,
  värd: 2,
  lekledare: 3,
  admin: 4,
};

export function hasRole(userRole: Role, required: Role): boolean {
  return LEVELS[userRole] >= LEVELS[required];
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  lekledare: "Lekledare",
  värd: "Värd",
  gäst: "Gäst",
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: "#8B2635",
  lekledare: "#1B3F6E",
  värd: "#3D6B3A",
  gäst: "#8B7355",
};

export const ALL_ROLES: Role[] = ["admin", "lekledare", "värd", "gäst"];
