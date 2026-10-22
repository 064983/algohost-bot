import type { Metadata } from "next";
import Link from "next/link";
import { Aperture, ArrowUpRight, Menu } from "lucide-react";
import { business } from "@/lib/config";
import { Providers } from "@/components/providers";
import { WhatsAppLink } from "@/components/whatsapp-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "saint_graphy | Photography for the beautifully ordinary",
  description:
    "Honest, thoughtful photography of your people, your milestones, and all the in-between moments you never want to forget.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>
        <header className="site-header">
          <div className="nav-wrap">
            <Link className="brand" href="/" aria-label="saint_graphy Photography home">
              <span className="brand-mark"><Aperture size={20} strokeWidth={1.6} /></span>
              <span>saint_graphy</span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/#work">The work</Link>
              <Link href="/#services">Photography</Link>
              <Link href="/#about">About</Link>
              <Link href="/#contact">Get in touch</Link>
            </nav>
            <details className="mobile-menu">
              <summary aria-label="Open navigation menu"><Menu size={20}/></summary>
              <nav aria-label="Mobile navigation">
                <Link href="/#work">The work</Link><Link href="/#services">Photography</Link>
                <Link href="/#about">About</Link><Link href="/#contact">Get in touch</Link>
              </nav>
            </details>
            <Link className="header-cta" href="/#contact">Let’s talk <ArrowUpRight size={15} /></Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <Link className="brand" href="/"><span className="brand-mark"><Aperture size={19} strokeWidth={1.6} /></span><span>saint_graphy</span></Link>
            <p>Photographs for the moments that matter.</p>
            <div className="footer-links">
              <Link href="/#work">The work</Link><Link href="/#services">Photography</Link>
              <span>{business.name} · South Africa</span>
            </div>
          </div>
        </footer>
        <WhatsAppLink className="whatsapp-float" aria-label="Chat with us on WhatsApp">
          <ArrowUpRight size={19} /><span>Let’s talk</span>
        </WhatsAppLink>
      </Providers></body>
    </html>
  );
}
