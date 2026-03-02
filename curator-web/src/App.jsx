import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Music, Building2, Users, Rocket, Coins, Sparkles, ArrowRight } from 'lucide-react';

const SLIDES_COUNT = 6;

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  // Handle wheel scrolling
  useEffect(() => {
    let lastTime = 0;
    const handleWheel = (e) => {
      const now = new Date().getTime();
      if (now - lastTime < 500) return; // Debounce

      if (e.deltaY > 50 && currentSlide < SLIDES_COUNT - 1) {
        setDirection(1);
        setCurrentSlide(prev => prev + 1);
        lastTime = now;
      } else if (e.deltaY < -50 && currentSlide > 0) {
        setDirection(-1);
        setCurrentSlide(prev => prev - 1);
        lastTime = now;
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentSlide]);

  const slideVariants = {
    initial: (dir) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: (dir) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } })
  };

  const nextSlide = () => {
    if (currentSlide < SLIDES_COUNT - 1) {
      setDirection(1);
      setCurrentSlide(s => s + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(s => s - 1);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-white overflow-hidden relative font-sans flex flex-col items-center justify-center">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Main Slide Area */}
      <div className="relative z-10 w-full max-w-6xl mx-auto h-full flex flex-col justify-center px-6 sm:px-12">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full flex flex-col justify-center absolute inset-0 px-6 sm:px-12"
          >
            {currentSlide === 0 && <SlideCover />}
            {currentSlide === 1 && <SlideProblem />}
            {currentSlide === 2 && <SlideSolution />}
            {currentSlide === 3 && <SlideCurator />}
            {currentSlide === 4 && <SlideReward />}
            {currentSlide === 5 && <SlideOutro />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        {Array.from({ length: SLIDES_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-indigo-400 scale-125' : 'bg-slate-700 hover:bg-slate-500'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Up/Down Controls - Mobile friendly */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-20 md:hidden">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="p-3 bg-white/10 rounded-full disabled:opacity-30">
          <ChevronUp size={24} />
        </button>
        <button onClick={nextSlide} disabled={currentSlide === SLIDES_COUNT - 1} className="p-3 bg-white/10 rounded-full disabled:opacity-30">
          <ChevronDown size={24} />
        </button>
      </div>

      {currentSlide < SLIDES_COUNT - 1 && (
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 hidden md:flex flex-col items-center cursor-pointer z-20"
          onClick={nextSlide}
        >
          <span className="text-sm tracking-widest uppercase mb-2 opacity-70">Scroll</span>
          <ChevronDown size={24} />
        </motion.div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 1: 메인 커버
// -----------------------------------------------------------------
function SlideCover() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
          <Sparkles size={48} className="text-white" />
        </div>
        <h2 className="text-xl md:text-2xl text-indigo-300 font-medium tracking-widest mb-4">당신이 부르면 공연이 시작됩니다</h2>
      </motion.div>

      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-6xl md:text-8xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200 mb-8">
        DIG
      </motion.h1>

      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-xl md:text-2xl text-slate-400 max-w-2xl font-light">
        팬덤의 열망을 모아 공연장을 깨우고, 인디씬의 새로운 자생적 생태계를 만드는 <br className="hidden md:block" />
        <span className="text-white font-medium">B2B 역경매 공연 매칭 플랫폼</span>
      </motion.p>
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 2: 문제의식 (Problem)
// -----------------------------------------------------------------
function SlideProblem() {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl md:text-5xl font-bold mb-16 text-slate-100">
        무엇이 문제인가요? <span className="text-indigo-500">The Problem</span>
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
          <div className="w-14 h-14 bg-rose-500/20 rounded-xl flex items-center justify-center mb-6">
            <Music size={28} className="text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-white">인디밴드의 '데스 밸리'</h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            인지도를 쌓기 위해 무대가 필요하지만, <strong>비싼 대관료</strong> 때문에 매번 금전적 손실을 감수해야 합니다. 결국 음악을 포기하는 구조적 한계.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
          <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6">
            <Building2 size={28} className="text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-white">공연장의 '유휴 공실'</h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            주말 골든타임 외에는 운영되지 못하고 <strong>버려지는 유휴 시간대</strong>가 발생합니다. 이는 라이브 클럽 생태계의 고정비 부담을 가중시킵니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 3: 해결책 (Solution)
// -----------------------------------------------------------------
function SlideSolution() {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">팬이 부르고, 공연장이 입찰합니다</h2>
        <p className="text-xl text-indigo-300">혁신적인 역경매 대관 매칭 시스템, 무대소환</p>
      </motion.div>

      <div className="relative">
        {/* 연결 선 */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent -translate-y-1/2 opacity-30 hidden md:block" />

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/50">
              <Users size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">1. 팬덤의 소환 (모객)</h3>
            <p className="text-sm text-slate-400">관객들의 참여와 예치금 결제로 100% 모객 달성 시 밴드의 공연 확정</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-gradient-to-b from-indigo-900/50 to-slate-900 border border-indigo-500 p-8 rounded-2xl text-center flex flex-col items-center transform md:-translate-y-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-6 border border-fuchsia-500/50">
              <Rocket size={32} className="text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">2. 역경매 입찰</h3>
            <p className="text-sm text-slate-300">공연장들이 자신들의 유휴 시간대를 활용해 밴드에게 역으로 대관료/조건 제안</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-slate-900 border border-fuchsia-500/30 p-8 rounded-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/50">
              <Coins size={32} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">3. B2B 윈-윈</h3>
            <p className="text-sm text-slate-400">밴드는 대관료 부담 Zero, 공연장은 유휴 시간 수익 창출</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 4: 큐레이터의 역할 (Why Curator)
// -----------------------------------------------------------------
function SlideCurator() {
  return (
    <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
      <div className="order-2 md:order-1">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            플랫폼 수익의 핵심 파트너, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">큐레이터 (Curator)</span>
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            아무리 좋은 공연도 관객이 모이지 않으면 성사될 수 없습니다. <br />
            큐레이터는 밴드와 관객을 잇는 <strong className="text-white">최전선 마케터</strong>입니다.
          </p>

          <ul className="space-y-6">
            {[
              { title: "영향력 기반 모객", desc: "자신의 SNS, 커뮤니티 영향력을 활용해 팬들을 '소환'에 참여시킵니다." },
              { title: "공연 성사율 극대화", desc: "잠재력 있는 밴드의 공연 펀딩을 100%까지 견인하는 촉매제가 됩니다." },
              { title: "공동의 성공 (Co-Success)", desc: "단순한 홍보를 넘어, 결과물(매출)을 시스템을 통해 직접 Share 받습니다." }
            ].map((item, idx) => (
              <motion.li key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }} className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ArrowRight size={14} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
      <div className="order-1 md:order-2 flex justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }} className="w-full max-w-sm relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-3xl blur-2xl opacity-40"></div>
          <div className="relative bg-[#111122] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full"></div>
              <div>
                <div className="font-bold text-lg text-white">Curator</div>
                <div className="text-indigo-400 text-sm">핵심 마케터 • 기획자</div>
              </div>
            </div>
            <div className="h-px w-full bg-white/10 mb-6"></div>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-300">내 홍보로 유입된 관객</span>
                <span className="font-bold text-xl text-white">124명</span>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center">
                <span className="text-indigo-300 font-medium">예상 수익 배분(Share)</span>
                <span className="font-bold text-xl text-indigo-400">₩ 3,450,000</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 5: 리워드 (Reward)
// -----------------------------------------------------------------
function SlideReward() {
  return (
    <div className="max-w-5xl mx-auto w-full text-center">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-fuchsia-400 font-bold tracking-widest uppercase mb-4 text-sm">Ticket To Earn (T2E)</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold text-white mb-16">
        기여한 만큼 확실하게 가져갑니다
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-8 text-left">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/80 border border-slate-700 p-8 rounded-3xl">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-2xl font-bold text-white">투명한 티켓 수익 쉐어</h3>
            <Coins size={40} className="text-fuchsia-400 opacity-50" />
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">
            자신의 고유 <strong className="text-indigo-400">초대장 링크</strong>를 통해 티켓 결제가 발생할 때마다, 해당 티켓 매출의 <strong>약정된 N%</strong>가 큐레이터의 계정으로 즉각 적립됩니다.
          </p>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-[70%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full"></div>
          </div>
          <div className="mt-2 text-right text-sm text-slate-500">실시간 데이터 연동</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900/80 border border-slate-700 p-8 rounded-3xl">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-2xl font-bold text-white">데이터 기반 대시보드</h3>
            <Rocket size={40} className="text-indigo-400 opacity-50" />
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">
            나의 레퍼럴로 인한 모객 현황, 밴드의 목표 달성률, 그리고 누적 리워드 금액을 <strong>전용 대시보드</strong>에서 실시간으로 확인하고 출금할 수 있습니다.
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300">투명성</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300">확장성</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300">팬덤 연계</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 슬라이드 6: 마무리 (Outro)
// -----------------------------------------------------------------
function SlideOutro() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="w-24 h-24 mb-8">
        <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
          <Sparkles size={40} className="text-slate-900" />
        </div>
      </motion.div>

      <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
        새로운 공연 문화를 <br />
        함께 만들어갈 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">초기 큐레이터</span>를 모십니다.
      </motion.h2>

      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-slate-400 mb-12">
        음악에 대한 애정이 당신의 무기가 됩니다. <br />
        지금 DIG 파트너로 합류하세요.
      </motion.p>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ delay: 0.6 }}
        className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow flex items-center gap-2"
      >
        파트너 합류 문의하기 <ArrowRight size={20} />
      </motion.button>
    </div>
  );
}
