"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { business } from "@/lib/config";

const SettingsContext = createContext({ whatsappNumber: business.whatsappNumber });

export function Providers({ children }: { children: ReactNode }) {
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsappNumber);
  useEffect(() => {
    fetch("/api/settings").then(async response => {
      if (!response.ok) return;
      const settings = await response.json();
      if (typeof settings.whatsappNumber === "string") setWhatsappNumber(settings.whatsappNumber);
    }).catch(() => {});
  }, []);
  return <SettingsContext.Provider value={{ whatsappNumber }}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SettingsContext);
}
