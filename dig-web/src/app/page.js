import Link from 'next/link';
import { ArrowRight, Ticket, Building2, Mic2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        DIG : 당신이 부르면 공연이 시작됩니다
      </h1>
      <p className="text-zinc-500 mb-16 text-xl tracking-wide">하이엔드 B2B 제안용 프레젠테이션 허브 (Next.js)</p>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
        <Link href="/curator" className="group p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-primary transition-all duration-300">
          <Ticket size={48} className="text-primary mb-6" />
          <h2 className="text-3xl font-black mb-2 text-white">Version A</h2>
          <p className="text-primary font-bold mb-4">관객 및 큐레이터 타겟</p>
          <p className="text-zinc-400 mb-8 leading-relaxed">VIP 마이크로 인플루언서 피드백 수집 및 네트워크 확보 목적</p>
          <div className="text-primary flex items-center gap-2 font-bold group-hover:translate-x-2 transition-transform">
            열기 <ArrowRight size={20} />
          </div>
        </Link>

        <Link href="/venue" className="group p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-secondary transition-all duration-300">
          <Building2 size={48} className="text-secondary mb-6" />
          <h2 className="text-3xl font-black mb-2 text-white">Version B</h2>
          <p className="text-secondary font-bold mb-4">공연장 및 공간 운영자</p>
          <p className="text-zinc-400 mb-8 leading-relaxed">공실 스트레스 공감 및 시범 도입(Pilot) 티미팅 유도 목적</p>
          <div className="text-secondary flex items-center gap-2 font-bold group-hover:translate-x-2 transition-transform">
            열기 <ArrowRight size={20} />
          </div>
        </Link>

        <Link href="/artist" className="group p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500 transition-all duration-300">
          <Mic2 size={48} className="text-yellow-500 mb-6" />
          <h2 className="text-3xl font-black mb-2 text-white">Version C</h2>
          <p className="text-yellow-500 font-bold mb-4">인디 아티스트</p>
          <p className="text-zinc-400 mb-8 leading-relaxed">적자 공연 스트레스 공감 빛 연대감 형성, 1:1 커피챗 유도</p>
          <div className="text-yellow-500 flex items-center gap-2 font-bold group-hover:translate-x-2 transition-transform">
            열기 <ArrowRight size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
}
