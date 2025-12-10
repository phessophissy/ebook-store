/**
 * Main layout component with navigation
 */

import Link from "next/link";
import { ReactNode } from "react";
import WalletConnect from "./WalletConnect";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-stacks-purple"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xl font-bold text-white">eBook Store</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-white/70 hover:text-white transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/upload"
                className="text-white/70 hover:text-white transition-colors"
              >
                Publish
              </Link>
              <Link
                href="/my-books"
                className="text-white/70 hover:text-white transition-colors"
              >
                My Books
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-white/40">
            <div>Built on Stacks (Bitcoin L2) with Clarity 4</div>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
