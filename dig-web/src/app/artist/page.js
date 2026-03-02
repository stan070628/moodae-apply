'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Globe, Mic2, MessageCircle } from 'lucide-react';

export default function ArtistPage() {
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Slide 2: Physics Drop
        gsap.fromTo('.heavy-drop',
            { y: -300, rotation: -5 },
            {
                y: 0,
                rotation: 0,
                duration: 2,
                ease: 'bounce.out',
                scrollTrigger: {
                    trigger: '.problem-section',
                    start: 'top 50%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Slide 3: Map Ping Stagger
        gsap.to('.ping-dot', {
            scale: 2.5,
            opacity: 0,
            duration: 1.5,
            stagger: { each: 0.2, repeat: -1 },
            ease: 'power2.out',
        });

        // Slide 4: Stamp Animation
        gsap.fromTo('.stamp',
            { scale: 5, opacity: 0, rotation: -30 },
            {
                scale: 1, opacity: 1, rotation: -10, duration: 0.5, ease: 'back.out(2)',
                scrollTrigger: {
                    trigger: '.stamp-section',
                    start: 'top 60%',
                    toggleActions: 'play none none reverse'
                },
                onComplete: () => {
                    gsap.fromTo('.bento-card', { x: -5 }, { x: 5, duration: 0.05, yoyo: true, repeat: 5 });
                }
            }
        );

        // Slide 6: Direct Matching Ray
        gsap.fromTo('.match-ray',
            { scaleX: 0, transformOrigin: 'left center' },
            {
                scaleX: 1, duration: 1, ease: 'power2.inOut',
                scrollTrigger: {
                    trigger: '.match-section',
                    start: 'top 60%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Slide 7: Parallax Gallery
        gsap.utils.toArray('.gallery-item').forEach((item, i) => {
            gsap.fromTo(item,
                { y: 100, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1, delay: i * 0.1,
                    scrollTrigger: {
                        trigger: '.gallery-section',
                        start: 'top 70%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        return () => ScrollTrigger.getAll().forEach(t => t.kill());
    }, []);

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <main ref={containerRef} onMouseMove={handleMouseMove} className="bg-[#0a0a0a] text-white min-h-screen font-sans overflow-x-hidden">

            {/* Slide 1: Spotlight Hero */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden cursor-none">
                <div className="absolute inset-0 z-0 bg-black" />
                {/* Background gear image revealed by mask */}
                <div
                    className="absolute inset-0 z-10 pointer-events-none transition-transform duration-75"
                    style={{
                        WebkitMaskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 30%, transparent 100%)`,
                        maskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 30%, transparent 100%)`,
                    }}
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2800&auto=format&fit=crop')] bg-cover bg-center mix-blend-screen opacity-60" />
                </div>

                <div className="relative z-20 text-center px-6 mix-blend-difference pointer-events-none">
                    <Mic2 size={48} className="mx-auto mb-8 text-white opacity-80" />
                    <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter mix-blend-difference">
                        대관료 걱정 없이, <br />
                        오직 <span className="italic font-serif">음악과 팬에게만</span> 집중하는 무대.
                    </h1>
                </div>
            </section>

            {/* Slide 2: Physics Drop (Problem) */}
            <section className="problem-section relative py-32 h-[800px] bg-[#050505] overflow-hidden flex flex-col justify-end">
                {/* Abstract dot pyramid for musicians */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full flex items-center justify-center opacity-10">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,transparent,black)]" />
                </div>

                <div className="relative z-20 text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-400 mb-6 max-w-4xl mx-auto leading-tight">
                        본업 수익 부족과 3,168팀의 치열한 경쟁.<br />이제 사비 터는 <span className="text-primary font-black">적자 공연의 늪</span>을 끊어내야 합니다.
                    </h2>
                </div>

                <div className="h-64 flex items-end justify-center border-b border-zinc-800 pb-2 relative z-10 w-full max-w-5xl mx-auto">
                    <div className="heavy-drop bg-zinc-900 border-[3px] border-zinc-700 px-12 py-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,1)]">
                        <span className="text-zinc-500 font-bold tracking-widest block mb-2 uppercase text-sm">월평균 소득</span>
                        <div className="text-6xl md:text-8xl font-black text-white mix-blend-difference">150만 원</div>
                    </div>
                </div>
            </section>

            {/* Slide 3: Solution (Neon Ping Map) */}
            <section className="py-32 bg-[#000000] relative">
                <div className="max-w-4xl mx-auto text-center relative z-20 mb-24 px-6">
                    <h2 className="text-4xl md:text-6xl font-black leading-tight">
                        팬들이 당신을 부르는 곳이 <br />
                        <span className="text-primary text-glow shadow-primary/50">곧 무대가 됩니다.</span>
                    </h2>
                </div>

                <div className="relative h-[500px] max-w-5xl mx-auto bg-zinc-950/50 rounded-3xl border border-white/5 overflow-hidden">
                    {/* Mock Map Texture */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2800&auto=format&fit=crop')] bg-cover mix-blend-luminosity grayscale" />

                    {/* Pings */}
                    {[
                        { top: '30%', left: '40%', delay: '0s' },
                        { top: '60%', left: '70%', delay: '0.4s' },
                        { top: '45%', left: '55%', delay: '0.8s' },
                        { top: '70%', left: '30%', delay: '1.2s' },
                        { top: '25%', left: '60%', delay: '1.6s' }
                    ].map((pos, i) => (
                        <div key={i} className="absolute w-4 h-4" style={{ top: pos.top, left: pos.left }}>
                            <div className="w-3 h-3 bg-primary rounded-full relative z-10 border border-black shadow-[0_0_15px_#ff007f]" />
                            <div
                                className="ping-dot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-primary bg-primary/20"
                                style={{ animationDelay: pos.delay }}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Slide 4: Quality Selection (Stamp) */}
            <section className="stamp-section py-32 bg-[#020202]">
                <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-zinc-100">
                            아무나 오를 수 없는 무대, <br />
                            오직 <span className="text-yellow-500">검증된 프로 아티스트</span>만을 위한 플랫폼.
                        </h2>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light">
                            무대소환은 허수가 아닌 진성 팬덤을 움직일 수 있는 아티스트와 함께합니다. 품질 높은 큐레이션을 통해 아티스트의 브랜드 가치를 지켜드립니다.
                        </p>
                    </div>

                    <div className="flex justify-center relative">
                        <div className="bento-card w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden">
                            <div className="w-24 h-24 bg-zinc-800 rounded-full mb-6 mx-auto" />
                            <div className="h-6 w-32 bg-zinc-700 rounded-lg mx-auto mb-4" />
                            <div className="h-4 w-48 bg-zinc-800 rounded-lg mx-auto mb-10" />

                            <div className="flex justify-center gap-4 border-t border-zinc-800 pt-6">
                                <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
                                <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
                            </div>

                            {/* The Stamp */}
                            <div className="stamp absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-yellow-500 text-yellow-500 font-black text-3xl px-6 py-2 rounded-xl backdrop-blur-sm shadow-[0_0_40px_rgba(234,179,8,0.3)] bg-black/40 rotate-12 flex items-center gap-2">
                                <span>OFFICIAL ARTIST</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 6: Direct Matching */}
            <section className="match-section py-32 bg-[#050505]">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-24">
                        장르와 팬덤 규모에 완벽히 맞는 최적의 인프라를 <br />
                        <span className="text-secondary">다이렉트로 매칭</span>합니다.
                    </h2>

                    <div className="flex items-center justify-between max-w-4xl mx-auto relative h-64">
                        <div className="relative z-10 bg-zinc-900 p-8 rounded-full border-2 border-primary shadow-[0_0_30px_rgba(255,0,127,0.3)]">
                            <Mic2 size={48} className="text-primary" />
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-zinc-400 tracking-wider">Artist Needs</div>
                        </div>

                        {/* The Ray */}
                        <div className="absolute top-1/2 left-32 right-32 h-1 -translate-y-1/2 z-0">
                            <div className="match-ray w-full h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(0,229,255,0.8)]" />
                            {/* Particles moving along the ray */}
                            <div className="absolute top-1/2 left-0 w-4 h-4 -translate-y-1/2 bg-white rounded-full blur-[2px] animate-[pulse_2s_infinite]" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 opacity-20 scale-75 blur-sm"><MapPin size={32} /></div>
                            <div className="bg-[#0c0c16] p-8 rounded-[2rem] border-2 border-secondary shadow-[0_0_40px_rgba(0,229,255,0.4)] relative">
                                <MapPin size={48} className="text-secondary" />
                                <div className="absolute -right-8 -top-8 bg-secondary text-black font-black px-4 py-2 rounded-xl text-sm rotate-12">Perfect Fit!</div>
                            </div>
                            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 opacity-20 scale-75 blur-sm"><MapPin size={32} /></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 7: Archive & Global */}
            <section className="gallery-section py-32 bg-black overflow-hidden pointer-events-none">
                <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">아카이브를 넘어 <span className="text-white drop-shadow-[0_0_15px_#ffffff]">글로벌 생태계</span>로 확장</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 w-full h-[500px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className={`gallery-item bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 opacity-70 ${i % 2 === 0 ? 'translate-y-12' : ''}`}>
                            <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500">
                                <Globe size={32} className="text-zinc-700" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Slide 8: Soft CTA (Feedback & Coffee Chat) */}
            <section className="py-32 bg-[#050505] flex justify-center border-t border-zinc-900">
                <div className="max-w-4xl w-full text-center px-6">
                    <div className="inline-block p-6 rounded-full bg-primary/10 mb-8 border border-primary/20">
                        <MessageCircle size={48} className="text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">사비 대관료 없는 생태계, <br />베타 버전을 함께할 아티스트를 찾습니다.</h2>
                    <p className="text-zinc-400 mb-12 text-lg md:text-xl font-light max-w-2xl mx-auto">
                        실제 무대에 서며 느꼈던 페인포인트(Pain-point)를 들려주세요. 귀중한 피드백을 주신 아티스트에게는 정식 론칭 시 <strong className="text-white">최우선 매칭 및 수수료 면제 혜택</strong>을 드립니다.
                    </p>

                    <button className="group relative px-8 py-5 bg-white text-black font-black text-xl rounded-full hover:scale-105 active:scale-95 transition-all duration-300">
                        플랫폼 개선을 위한 커피챗 참여하기
                        {/* Ripple effect on hover using CSS */}
                        <span className="absolute inset-0 rounded-full border border-white opacity-0 group-hover:animate-ping mix-blend-difference" />
                    </button>
                </div>
            </section>

        </main>
    );
}
