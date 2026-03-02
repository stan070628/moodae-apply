'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollVideo({ src, className = '', poster = '' }) {
    const videoRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const video = videoRef.current;
        if (!video || !src) return;

        const trigger = ScrollTrigger.create({
            trigger: video,
            start: 'top 80%',
            end: 'bottom 20%',
            onEnter: () => {
                if (video.paused) video.play().catch(() => { });
            },
            onEnterBack: () => {
                if (video.paused) video.play().catch(() => { });
            },
            onLeave: () => {
                if (!video.paused) video.pause();
            },
            onLeaveBack: () => {
                if (!video.paused) video.pause();
            }
        });

        return () => trigger.kill();
    }, [src]);

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            className={`relative z-10 ${className}`}
            data-cursor="play"
        />
    );
}
