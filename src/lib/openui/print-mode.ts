"use client";

import { createContext, useContext } from "react";

/** True inside the light, offscreen copy of an answer that a PDF is made from. */
export const PrintModeContext = createContext(false);

/** Whether visuals should draw for a dark page: the system theme, except when printing. */
export function useDarkTheme(): boolean {
  const printing = useContext(PrintModeContext);
  return !printing && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
