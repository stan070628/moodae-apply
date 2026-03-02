// src/components/BentoBox.js
import React from 'react';

export function BentoGrid({ className = '', children }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 auto-rows-[300px] gap-6 max-w-7xl mx-auto w-full px-6 ${className}`}>
            {children}
        </div>
    );
}

export function BentoItem({ className = '', title, description, header, icon }) {
    return (
        <div className={`relative overflow-hidden group/bento bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-primary/50 hover:shadow-[0_0_40px_-15px_rgba(255,0,127,0.3)] transition-all duration-500 ${className}`}>
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500" />

            {/* Visual Content Layer */}
            {header && (
                <div className="absolute inset-0 w-full h-full z-0 opacity-50 group-hover/bento:opacity-100 transition-opacity duration-500 overflow-hidden">
                    {header}
                </div>
            )}

            {/* Text layer */}
            <div className="z-10 relative mt-auto translate-y-2 group-hover/bento:translate-y-0 transition-transform duration-500">
                <div className="mb-4 text-white/50 group-hover/bento:text-primary transition-colors duration-300">
                    {icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-sm">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
