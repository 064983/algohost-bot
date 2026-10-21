import type { Metadata } from "next";
import Link from "next/link";
import { Menu, MessageCircle, Zap } from "lucide-react";
import { business } from "@/lib/config";
import { Providers } from "@/components/providers";
import { WhatsAppLink } from "@/components/whatsapp-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Algohost Bot | Trading Bot Activation IDs",
  description:
    "Explore trading bot activation options and purchase a valid unlocking ID with direct WhatsApp support.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>
        <header className="site-header">
          <div className="nav-wrap">
            <Link className="brand" href="/" aria-label="Algohost Bot home">
              <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
              <span>Algo<span className="brand-accent">host</span> Bot</span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/">Home</Link>
              <Link href="/#bots">Trading Bots</Link>
              <Link href="/#how-it-works">How It Works</Link>
              <Link href="/account">My Orders</Link>
              <Link href="/#contact">Contact Us</Link>
            </nav>
            <details className="mobile-menu">
              <summary aria-label="Open navigation menu"><Menu size={20}/></summary>
              <nav aria-label="Mobile navigation">
                <Link href="/">Home</Link><Link href="/#bots">Trading Bots</Link>
                <Link href="/#how-it-works">How It Works</Link><Link href="/account">My Orders</Link>
                <Link href="/#contact">Contact Us</Link><Link href="/login">Login / Register</Link>
              </nav>
            </details>
            <Link className="button button-small button-outline nav-login" href="/login">Login / Register</Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <Link className="brand" href="/"><span className="brand-mark"><Zap size={17} fill="currentColor" /></span><span>Algohost Bot</span></Link>
            <p>Activation IDs for trading tools. No bot downloads or source-code delivery.</p>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link><Link href="/terms">Terms & Refunds</Link><span>{business.name} · South Africa</span>
            </div>
          </div>
        </footer>
        <WhatsAppLink className="whatsapp-float" aria-label="Chat with us on WhatsApp">
          <MessageCircle size={22} /><span>Chat on WhatsApp</span>
        </WhatsAppLink>
      </Providers></body>
    </html>
  );
}
