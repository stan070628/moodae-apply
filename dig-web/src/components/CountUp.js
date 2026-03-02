'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function CountUp({ end, suffix = '', prefix = '', decimals = 0, duration = 2.5, className = '' }) {
    const ref = useRef(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const el = ref.current;
        if (!el) return;

        let obj = { val: 0 };

        gsap.to(obj, {
            val: end,
            duration: duration,
            ease: 'power4.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
            onUpdate: () => {
                // Only update state if value has changed enough to visually update
                setValue(Number(obj.val.toFixed(decimals)));
            }
        });
    }, [end, duration, decimals]);

    return (
        <span ref={ref} className={className}>
            {prefix}{value.toFixed(decimals)}{suffix}
        </span>
    );
}
