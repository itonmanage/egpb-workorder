'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="w-full py-4 px-4 sm:px-6 md:px-12 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-green-100 dark:border-green-900">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary tracking-tighter">
          EGPB<span className="text-foreground">Ticket</span>
        </Link>

        <div className="hidden md:flex gap-8 items-center font-medium text-sm text-foreground/80">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="#services" className="hover:text-primary transition-colors">Services</Link>
          <Link href="#about" className="hover:text-primary transition-colors">About</Link>
        </div>

        <div className="hidden md:flex gap-4 items-center">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-green-500/20"
          >
            Sign Up
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-foreground hover:bg-green-50 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-100 dark:border-green-900">
            <span className="text-lg font-bold text-primary">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col p-4 space-y-2">
            <Link
              href="/"
              className="px-4 py-3 text-foreground hover:bg-green-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="#services"
              className="px-4 py-3 text-foreground hover:bg-green-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="#about"
              className="px-4 py-3 text-foreground hover:bg-green-50 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="mt-auto p-4 space-y-3 border-t border-green-100 dark:border-green-900">
            <Link
              href="/login"
              className="block w-full px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full px-4 py-3 text-center text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-green-500/20"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
