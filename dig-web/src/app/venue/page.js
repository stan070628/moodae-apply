'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CountUp from '@/components/CountUp';
import { Building, TrendingUp, Calendar, ShieldCheck, Mail } from 'lucide-react';

export default function VenuePage() {
    const containerRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Slide 1: Timelapse Crossfade
        gsap.to('.hero-color', {
            opacity: 1,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom 50%',
                scrub: true
            }
        });

        // Slide 3: Drag and Drop iPad Animation
        gsap.fromTo('.drag-item',
            { x: 300, y: -100, scale: 0.8, opacity: 0 },
            {
                x: 0, y: 0, scale: 1, opacity: 1, duration: 1.5, ease: 'back.out(1.2)',
                scrollTrigger: {
                    trigger: '.ipad-section',
                    start: 'top 60%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Slide 4: ASPV Stack Graph
        gsap.fromTo('.stack-item',
            { y: 100, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.3, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.stack-section',
                    start: 'top 70%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Slide 5: Parallax Dashboard
        gsap.fromTo('.parallax-panel',
            { y: 150, opacity: 0, rotateX: 20 },
            {
                y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.2, ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.parallax-section',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Slide 6: Equalizer
        gsap.to('.eq-bar', {
            height: 'random(20%, 75%)',
            duration: 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'none',
            stagger: {
                amount: 0.5,
                from: 'random'
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <main ref={containerRef} className="bg-black text-white min-h-screen overflow-hidden">

            {/* Slide 1: Hero Crossfade */}
            <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden">
                {/* B&W Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598387181032-a3103ea27ece?q=80&w=2800&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30" />

                {/* Color Background (fades in on scroll) */}
                <div className="hero-color absolute inset-0 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center opacity-0 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black z-10" />

                <div className="relative z-20 text-center max-w-4xl px-6">
                    <p className="text-secondary tracking-widest uppercase mb-4 font-bold">Venue Partner</p>
                    <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8">
                        영업 없이, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-primary">100% 매진된 공연만</span><br />
                        공간으로 배달해 드립니다.
                    </h1>
                </div>
            </section>

            {/* Slide 2: Problem (Data Shock) */}
            <section className="py-32 bg-black">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16 text-zinc-300">
                        완벽한 설비를 갖춘 당신의 공간을<br />방치하지 마세요.
                    </h2>
                    <div className="bg-zinc-900 border border-red-900/30 rounded-[3rem] p-16 relative overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
                        <p className="text-2xl text-zinc-400 mb-6 font-medium">독립 공연장의</p>
                        <div className="text-8xl md:text-[150px] font-black text-red-500 mb-6 leading-none">
                            <CountUp end={64} suffix="%" duration={2.5} />
                        </div>
                        <p className="text-3xl font-bold text-white">가 무수익 상태</p>
                    </div>
                </div>
            </section>

            {/* Slide 3: Solution (iPad Animation) */}
            <section className="ipad-section py-32 relative bg-zinc-950">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black mb-6">
                            수요가 100% 확정된 아티스트 팬덤,<br />
                            <span className="text-secondary">유휴 시간표에 다이렉트로 꽂힙니다.</span>
                        </h2>
                    </div>

                    <div className="relative mx-auto w-full max-w-4xl aspect-[4/3] bg-zinc-900 border-[12px] border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex">
                        {/* iPad Sidebar (Calendar overview) */}
                        <div className="w-64 bg-zinc-950 border-r border-white/5 p-6 space-y-4">
                            <div className="h-8 w-32 bg-zinc-800 rounded-lg mb-8" />
                            <div className="flex items-center gap-3 text-zinc-500"><Calendar size={20} /> 이번 주 일정</div>
                            <div className="h-20 w-full bg-zinc-900 rounded-xl" />
                            <div className="h-20 w-full bg-zinc-900 rounded-xl" />
                        </div>

                        {/* iPad Main View (Calendar grid) */}
                        <div className="flex-1 p-8 relative">
                            <div className="grid grid-cols-5 gap-4 h-full">
                                {/* Time slots */}
                                {Array.from({ length: 5 }).map((_, colIdx) => (
                                    <div key={colIdx} className="border-l border-white/5 flex flex-col gap-4 relative">
                                        <div className="h-10 text-center text-sm text-zinc-500 border-b border-white/5">Day {colIdx + 1}</div>
                                        <div className="flex-1 bg-zinc-900/50 rounded-lg border border-white/5" />
                                        <div className="flex-1 bg-zinc-900/50 rounded-lg border border-white/5 relative">
                                            {/* Empty Slot Target for Drag Animation */}
                                            {colIdx === 2 && (
                                                <div className="absolute inset-0 bg-secondary/10 border border-secondary border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                                                    <span className="text-secondary/50 font-bold text-sm">유휴 시간대 Drop</span>

                                                    {/* The Dragged Item */}
                                                    <div className="drag-item absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-[0_0_20px_rgba(255,0,127,0.5)] flex flex-col items-center justify-center p-2 z-10">
                                                        <span className="text-white font-black text-sm">100% 펀딩 달성</span>
                                                        <span className="text-white/80 text-xs">OOS 밴드 - 150명 확정</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 bg-zinc-900/50 rounded-lg border border-white/5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 4: Benefit 1 - ASPV Stack Graph */}
            <section className="stack-section py-32 bg-black">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-20">공실률 0%, 그리고 <br /><span className="text-primary">객단가(ASPV)의 비약적 상승</span></h2>

                    <div className="flex items-end justify-center gap-8 h-96 relative">
                        <div className="absolute bottom-0 w-full border-b border-zinc-800" />

                        {/* Old Model */}
                        <div className="w-48 flex flex-col justify-end items-center relative z-10">
                            <span className="mb-4 text-zinc-500 font-bold">기존 수익 구조</span>
                            <div className="w-full h-32 bg-zinc-800 rounded-t-xl flex items-center justify-center text-zinc-500 font-bold border border-zinc-700">기본 대관료</div>
                        </div>

                        {/* DIG Model */}
                        <div className="w-48 flex flex-col justify-end items-center relative z-10 space-y-2">
                            <span className="mb-4 text-primary font-bold">DIG 연동 수익</span>

                            {/* Stack 3: MD */}
                            <div className="stack-item w-full h-24 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-t-xl flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                현장 굿즈 (MD)
                            </div>
                            {/* Stack 2: F&B */}
                            <div className="stack-item w-full h-32 bg-gradient-to-r from-primary to-pink-500 rounded-sm flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(255,0,127,0.4)]">
                                프리미엄 F&B
                            </div>
                            {/* Stack 1: Rental */}
                            <div className="w-full h-32 bg-zinc-800 border border-zinc-600 rounded-sm flex items-center justify-center text-zinc-300 font-bold">기본 대관료 보장</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 5: Benefit 2 - AMS Parallax */}
            <section className="parallax-section py-32 bg-zinc-950 overflow-hidden perspective-1000">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">번거로운 정산과 계약,<br />통합 관리 시스템(AMS)으로 <span className="text-secondary">자동화.</span></h2>
                    </div>

                    <div className="relative h-[600px] flex items-center justify-center transform-style-3d">
                        <div className="parallax-panel absolute z-10 w-[600px] h-[400px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl -translate-x-32 -translate-y-12 flex flex-col">
                            <div className="p-4 border-b border-white/5 flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
                            <div className="p-6 flex-1 flex flex-col gap-4">
                                <div className="h-6 w-1/3 bg-zinc-800 rounded" />
                                <div className="flex gap-4">
                                    <div className="flex-1 h-32 bg-zinc-800/50 rounded-xl" />
                                    <div className="flex-1 h-32 bg-zinc-800/50 rounded-xl" />
                                </div>
                                <div className="flex-1 bg-zinc-800/50 rounded-xl" />
                            </div>
                        </div>

                        <div className="parallax-panel absolute z-20 w-[600px] h-[400px] bg-[#0c0c16] border border-primary/30 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] shadow-primary/20 translate-x-32 translate-y-12 flex flex-col backdrop-blur-md">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center text-primary font-bold"><span>자동 정산 리포트</span><TrendingUp size={20} /></div>
                            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center gap-4">
                                <div className="text-zinc-400">이번 달 누적 초과 수익</div>
                                <div className="text-6xl font-black text-white">+ ₩ <CountUp end={8500000} duration={2} /></div>
                                <div className="w-full h-24 mt-8 bg-gradient-to-t from-primary/20 to-transparent flex items-end justify-around px-8">
                                    {/* Fake bar chart */}
                                    {[40, 60, 45, 80, 50, 90, 100].map((h, i) => (
                                        <div key={i} className="w-6 bg-primary rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 6: Compliance Equalizer */}
            <section className="py-32 bg-black">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <ShieldCheck size={64} className="text-green-500 mx-auto mb-8" />
                    <h2 className="text-4xl md:text-5xl font-black mb-16 text-white">이웃과 상생하는 <span className="text-green-400">소음 관리 지침</span> 및 보험 지원</h2>

                    <div className="relative h-64 w-full max-w-2xl mx-auto border-b border-zinc-800 flex items-end justify-center gap-2 px-8">
                        {/* The 70dB Threshold Line */}
                        <div className="absolute top-[25%] left-0 w-full border-t-2 border-green-500/50 border-dashed z-10 flex">
                            <span className="text-green-400 font-bold ml-4 -mt-6">70dB Safe Line</span>
                        </div>

                        {/* Equalizer Bars */}
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="eq-bar w-full bg-gradient-to-t from-zinc-800 to-green-500/80 rounded-t-sm" style={{ height: '10%' }} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Slide 7: Soft CTA (Pilot Booking) */}
            <section className="py-32 bg-zinc-950 flex justify-center">
                <div className="max-w-3xl w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-16 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <Building size={48} className="text-secondary mx-auto mb-8" />
                    <h2 className="text-3xl md:text-4xl font-black mb-6">대표님의 공간을 금광으로 바꿀<br />첫 번째 파일럿 파트너를 찾습니다</h2>
                    <p className="text-zinc-400 mb-12 text-lg">부담 없는 티미팅을 통해 DIG 시스템의 가능성을 확인해 보세요.</p>

                    <form className="flex flex-col gap-6 relative z-10" onSubmit={(e) => { e.preventDefault(); alert('일정 조율 링크가 이메일로 발송되었습니다!'); }}>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="공연장 / 공간 이름" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-colors" required />
                            <input type="text" placeholder="담당자 성함" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-colors" required />
                        </div>
                        <input type="email" placeholder="이메일 주소" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-colors" required />
                        <button type="submit" className="mt-4 bg-white text-black font-bold text-xl rounded-xl px-6 py-5 hover:bg-secondary hover:text-white transition-all duration-300 shadow-[0_0_0_rgba(0,229,255,0)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] flex items-center justify-center gap-3">
                            시범 도입 논의 티미팅 예약하기 <Mail size={24} />
                        </button>
                    </form>
                </div>
            </section>

        </main>
    );
}
