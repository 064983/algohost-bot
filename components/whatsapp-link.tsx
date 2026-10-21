"use client";

import type { ReactNode } from "react";
import { whatsappUrl } from "@/lib/config";
import { useSiteSettings } from "./providers";

export function WhatsAppLink({ message, className, children, "aria-label": ariaLabel }: {
  message?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const { whatsappNumber } = useSiteSettings();
  return <a className={className} aria-label={ariaLabel} href={whatsappUrl(message, whatsappNumber)} target="_blank" rel="noreferrer">{children}</a>;
}
