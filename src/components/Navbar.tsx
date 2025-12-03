'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User } from 'lucide-react';
import { LOGO_URL } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-neutral-900/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo Section - COFE VAJE */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
             <img 
               src={LOGO_URL} 
               alt="Vaje Cafe Logo" 
               className="w-12 h-12 rounded-full border border-coffee-500/30 group-hover:border-coffee-400 transition-colors object-cover shadow-lg shadow-black/20"
             />
             <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] tracking-[0.4em] text-coffee-400 font-bold mb-1">CAFE</span>
                <span className="font-serif text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-coffee-200 to-coffee-600 tracking-wider">
                  VAJE
                </span>
             </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="mr-10 flex items-baseline space-x-8 space-x-reverse">
              <NavLink href="/" active={pathname === '/'}>خانه</NavLink>
              <NavLink href="/menu" active={pathname === '/menu'}>منو</NavLink>
              <NavLink href="/admin" active={pathname?.startsWith('/admin')}>
                <span className="flex items-center gap-1"><User size={16} className="ml-1"/> مدیریت</span>
              </NavLink>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-coffee-100 hover:text-white p-2 transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-neutral-900 border-b border-coffee-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-right">
            <MobileNavLink href="/">خانه</MobileNavLink>
            <MobileNavLink href="/menu">منو کافه</MobileNavLink>
            <MobileNavLink href="/admin">پنل مدیریت</MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink: React.FC<{ href: string; active: boolean; children: React.ReactNode }> = ({ href, active, children }) => (
  <Link
    href={href}
    className={`px-4 py-2 rounded-md text-lg font-medium transition-all duration-200 ${
      active 
        ? 'text-coffee-400 bg-white/5 font-bold' 
        : 'text-gray-300 hover:text-coffee-300 hover:bg-white/5'
    }`}
  >
    {children}
  </Link>
);

const MobileNavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link
    href={href}
    className="text-gray-300 hover:text-white hover:bg-white/10 block px-3 py-4 rounded-md text-lg font-medium border-r-2 border-transparent hover:border-coffee-500 transition-all"
  >
    {children}
  </Link>
);

export default Navbar;