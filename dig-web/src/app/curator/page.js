'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BentoGrid, BentoItem } from '@/components/BentoBox';
import CountUp from '@/components/CountUp';
import ScrollVideo from '@/components/ScrollVideo';
import { Music, MapPin, Share2, Coins, Disc, Send } from 'lucide-react';

export default function CuratorPage() {
    const containerRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Slide 1 text reveal
        gsap.fromTo('.hero-text span',
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power4.out', delay: 0.2 }
        );

        // Slide 5 Progress Line
        gsap.to('.progress-fill', {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.progress-container',
                start: 'top 50%',
                end: 'bottom 50%',
                scrub: true,
            }
        });

        // Cleanup
        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <main ref={containerRef} className="bg-background text-foreground min-h-screen font-sans overflow-hidden">

            {/* Slide 1: Hero Cover */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary to-secondary blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow pointer-events-none" />

                <h1 className="hero-text text-5xl md:text-8xl font-black text-center leading-tight tracking-tighter z-10 flex flex-col gap-2">
                    <div className="overflow-hidden"><span>당신의 안목이</span></div>
                    <div className="overflow-hidden"><span className="text-white">무대가 되고,</span></div>
                    <div className="overflow-hidden"><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">취향이 자산이 됩니다.</span></div>
                </h1>
                <p className="mt-8 text-zinc-400 text-xl tracking-wide font-light max-w-lg text-center opacity-80 z-10">
                    초기 트래픽을 주도할 VIP 큐레이터를 찾습니다.
                </p>
            </section>

            {/* Slide 2: Trend & Target (Spotlight Masking) */}
            <SpotlightSection />

            {/* Slide 3: Problem - Bento & Data Ping */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto mb-16 text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        왜 내 최애의 라이브는<br />항상 <span className="text-primary/80">멀리서만</span> 열릴까?
                    </h2>
                </div>

                <BentoGrid>
                    <BentoItem
                        title="수도권 상연 횟수"
                        icon={<MapPin size={32} className="text-zinc-600 mb-4" />}
                        description="전체 인디 공연의 압도적인 비율이 서울/홍대에 편중되어 있습니다."
                        header={
                            <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
                                <div className="text-5xl font-black text-primary animate-pulse">
                                    <CountUp end={80} suffix="," duration={2} />
                                    <CountUp end={509} suffix="회" duration={2.5} />
                                </div>
                            </div>
                        }
                    />
                    <BentoItem
                        className="md:col-span-2"
                        title="거리의 장벽"
                        icon={<Music size={32} className="text-zinc-600 mb-4" />}
                        description="지방에 있는 2030 팬들은 시간과 막대한 교통비용을 소모하며 원정 공연을 다녀야만 합니다."
                        header={
                            <div className="h-full w-full bg-zinc-900/50 flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540039155733-d76e6148ebmac?q=80&w=2800&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity grayscale" />
                                <p className="text-3xl font-bold text-white/40 z-10 italic">"이번에도 서울에서만 하네..."</p>
                            </div>
                        }
                    />
                </BentoGrid>
            </section>

            {/* Slide 4: Solution - Mobile App Video */}
            <section className="py-32 relative flex items-center justify-center min-h-screen">
                <div className="max-w-4xl mx-auto text-center z-10">
                    <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                        단 10초,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-500">당신의 공유 한 번으로</span><br />
                        공연이 시작됩니다.
                    </h2>

                    <div className="mt-16 relative w-72 h-[600px] mx-auto">
                        {/* Fake iPhone Mockup Wrapper */}
                        <div className="absolute inset-0 border-[8px] border-zinc-800 rounded-[3rem] shadow-2xl shadow-secondary/20 overflow-hidden bg-black z-20">
                            {/* Notch */}
                            <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-30">
                                <div className="w-1/3 h-full bg-zinc-800 rounded-b-3xl"></div>
                            </div>
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-zinc-700/50 rounded-[2.5rem]">
                                <Share2 size={48} className="text-secondary opacity-50 mb-4 animate-bounce" />
                                <p className="absolute text-sm text-zinc-500 font-bold bottom-10">영상 시뮬레이션 영역</p>
                                {/* <ScrollVideo src="/videos/instagram_viral.mp4" className="w-full h-full object-cover" /> */}
                            </div>
                        </div>
                        {/* Back glow */}
                        <div className="absolute inset-0 bg-secondary/30 blur-3xl z-10 rounded-full scale-110" />
                    </div>
                </div>
            </section>

            {/* Slide 5: Mechanism */}
            <section className="py-32 bg-zinc-950">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-24">
                        팬들이 모이면 100% 선결제,<br />
                        <span className="text-primary">노쇼(No-show) 없는 무대</span>가 확정됩니다.
                    </h2>

                    <div className="progress-container relative h-[400px] w-full flex justify-center">
                        {/* The line */}
                        <div className="absolute top-0 w-2 h-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="progress-fill w-full h-0 bg-gradient-to-b from-primary to-secondary rounded-full" />
                        </div>

                        {/* Steps */}
                        <div className="absolute w-full h-full flex flex-col justify-between items-center pointer-events-none">
                            <div className="translate-x-32 text-left w-48">
                                <div className="text-primary font-bold text-2xl">0%</div>
                                <div className="text-zinc-500 text-sm">소환 시작</div>
                            </div>
                            <div className="-translate-x-32 text-right w-48">
                                <div className="text-secondary font-bold text-2xl">50%</div>
                                <div className="text-zinc-500 text-sm">기대감 고조</div>
                            </div>
                            <div className="translate-x-32 text-left w-48">
                                <div className="text-white font-black text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">100%</div>
                                <div className="text-green-400 font-bold tracking-widest">공연 확정 완료!</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 6: Benefits */}
            <section className="py-32 px-6">
                <h2 className="text-center text-4xl font-bold mb-24">큐레이터를 위한 확실한 리워드</h2>
                <BentoGrid className="!grid-cols-1 md:!grid-cols-2 !auto-rows-[400px]">
                    <BentoItem
                        title="Taste-to-Earn (T2E)"
                        icon={<Coins size={36} className="text-yellow-500 mb-4" />}
                        description="큐레이션이 수익이 됩니다. 내가 공유한 링크로 결제가 일어날 때마다 수익을 분배받습니다."
                        header={
                            <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-800 flex items-center justify-center">
                                <div className="text-5xl font-black text-yellow-400">
                                    + <CountUp end={145000} suffix=" ₩" duration={3} />
                                </div>
                            </div>
                        }
                    />
                    <BentoItem
                        title="한정판 Phygital 굿즈"
                        icon={<Disc size={36} className="text-secondary mb-4" />}
                        description="소환 성공 시 VOD 관람권과 실물 LP가 융합된 한정판 패키지를 독점 제공합니다."
                        header={
                            <div className="w-full h-full bg-gradient-to-bl from-zinc-900 to-zinc-950 flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full border-[10px] border-zinc-800 animate-spin-slow flex items-center justify-center bg-zinc-900 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                                    <div className="w-10 h-10 rounded-full bg-secondary" />
                                </div>
                            </div>
                        }
                    />
                </BentoGrid>
            </section>

            {/* Slide 7: Soft CTA */}
            <section className="py-32 px-6 bg-zinc-950 flex justify-center">
                <div className="max-w-2xl w-full bg-zinc-900 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <h2 className="text-3xl font-bold mb-4">DIG 생태계를 이끌어갈<br />VIP 큐레이터 그룹 초대</h2>
                    <p className="text-zinc-400 mb-10">초기 앱 베타 버전을 보고 날카로운 피드백을 들려주세요.</p>

                    <form className="flex flex-col gap-4 relative z-10" onSubmit={(e) => { e.preventDefault(); alert('초대장이 발송되었습니다 ☕'); }}>
                        <input type="text" placeholder="이름 (Name)" className="bg-black/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors" required />
                        <input type="text" placeholder="인스타그램 ID (@username)" className="bg-black/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors" required />
                        <button type="submit" className="mt-4 bg-white text-black font-bold text-lg rounded-xl px-6 py-4 hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                            프라이빗 커피챗 신청하기 <Send size={20} />
                        </button>
                    </form>
                </div>
            </section>

        </main>
    );
}

// Sub-component for Spotlight section
function SpotlightSection() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative h-screen bg-black flex items-center justify-center overflow-hidden cursor-none"
        >
            {/* Base Layer (Black & White) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 grayscale">
                <h2 className="text-center text-4xl md:text-5xl font-black leading-tight text-white/20">
                    남들은 모르는 나만의 밴드를 발굴하는<br />'디깅(Digging)'의 시대.<br />
                    대한민국 공연 시장, 핵심 소비층이 움직입니다.
                </h2>
            </div>

            {/* Mask Layer (Color & Neon) */}
            <div
                className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                style={{
                    WebkitMaskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                    maskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                }}
            >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-screen" />
                <h2 className="text-center text-4xl md:text-5xl font-black leading-tight text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.8)]">
                    남들은 모르는 나만의 밴드를 발굴하는<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">'디깅(Digging)'의 시대.</span><br />
                    대한민국 공연 시장, <span className="text-secondary">핵심 소비층</span>이 움직입니다.
                </h2>
            </div>
        </section>
    );
}
