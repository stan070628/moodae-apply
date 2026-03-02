'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Play } from 'lucide-react';

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const [cursorState, setCursorState] = useState('default'); // 'default', 'hover', 'play'

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // Set initial position
        gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 });

        const onMouseMove = (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: 'power2.out',
                opacity: 1
            });
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const isInteraction = target.closest('[data-cursor="play"]');
            const isClickable = target.closest('button, a, input, select, textarea') || window.getComputedStyle(target).cursor === 'pointer';
            const isText = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'STRONG'].includes(target.tagName) && !isClickable;

            if (isInteraction) {
                setCursorState('play');
            } else if (isClickable) {
                setCursorState('hover');
            } else if (isText) {
                setCursorState('text');
            } else {
                setCursorState('default');
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseover', handleMouseOver);

        // Hide real cursor globally
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseover', handleMouseOver);
            document.body.style.cursor = 'auto'; // restore
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center transition-all duration-300 ease-out origin-center
        ${cursorState === 'default'
                    ? 'w-4 h-4 bg-white mix-blend-difference'
                    : cursorState === 'play'
                        ? 'w-20 h-20 bg-primary/90 text-white backdrop-blur-sm'
                        : cursorState === 'hover'
                            ? 'w-12 h-12 bg-transparent border-[1.5px] border-secondary mix-blend-normal'
                            : cursorState === 'text'
                                ? 'w-16 h-16 bg-white mix-blend-difference'
                                : 'w-4 h-4 bg-white mix-blend-difference'
                }
      `}
        >
            {cursorState === 'play' && <Play size={28} fill="currentColor" className="ml-1" />}
        </div>
    );
}
