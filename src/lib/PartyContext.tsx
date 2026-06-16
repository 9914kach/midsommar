"use client";

import { createContext, useContext } from "react";

export const PartyContext = createContext(false);

export function usePartyUnlocked() {
  return useContext(PartyContext);
}
