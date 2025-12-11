/**
 * Main layout component with responsive navigation
 */

import Link from "next/link";
import { ReactNode, useState } from "react";
import WalletConnect from "./WalletConnect";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-white/10 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 text-stacks-purple"
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
              <span className="text-lg sm:text-xl font-bold text-white">eBook Store</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/"
                className="block py-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>
              <Link
                href="/upload"
                className="block py-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Publish
              </Link>
              <Link
                href="/my-books"
                className="block py-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Books
              </Link>
              <div className="pt-2 border-t border-white/10">
                <WalletConnect />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto safe-area-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/40">
            <div className="text-center sm:text-left">Built on Stacks (Bitcoin L2) with Clarity 4</div>
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
                href="https://github.com/phessophissy/ebook-store"
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
