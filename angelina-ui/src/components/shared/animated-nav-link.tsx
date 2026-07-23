'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface AnimatedNavLinkProps {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}

export function AnimatedNavLink({ href, label, className = '', onClick }: AnimatedNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  // Split the label into words and then characters
  const words = label.split(' ');

  return (
    <Link
      href={href}
      className={`group flex items-center justify-center bg-transparent transition-opacity duration-300 px-5 py-8 ${
        isActive ? 'opacity-70' : 'hover:opacity-80'
      } ${className}`}
      onClick={onClick}
    >
      <div className="relative overflow-hidden uppercase text-current font-medium text-[11px] leading-[13px] tracking-[1.5px] font-body flex gap-1">
        
        {/* Top Text (Default visible) */}
        <div className="flex gap-1">
          {words.map((word, wIdx) => (
            <div key={`top-word-${wIdx}`} className="flex">
              {word.split('').map((char, cIdx) => (
                <span
                  key={`top-char-${wIdx}-${cIdx}`}
                  className="inline-block transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[150%]"
                  style={{ transitionDelay: `${(wIdx * word.length + cIdx) * 20}ms` }}
                >
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Text (Hidden below, slides up on hover) */}
        <div className="absolute inset-0 flex gap-1">
          {words.map((word, wIdx) => (
            <div key={`bottom-word-${wIdx}`} className="flex">
              {word.split('').map((char, cIdx) => (
                <span
                  key={`bottom-char-${wIdx}-${cIdx}`}
                  className="inline-block translate-y-[150%] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
                  style={{ transitionDelay: `${(wIdx * word.length + cIdx) * 20}ms` }}
                >
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>

      </div>
    </Link>
  );
}
