'use client';

import React, { useState } from 'react';
import { Settings, Users, ArrowLeftRight, Check, X, Sparkles, MessageSquarePlus } from 'lucide-react';

const mockPlanData = {
  id: "plan-1",
  title: "DIG 프로젝트 제안서",
  progress: 45,
  lastUpdated: "2시간 전",
  sections: [
    { id: 'why', title: 'WHY (문제 정의)', content: "현재 대한민국의 인디 공연 생태계는 심각한 불균형과 '데스 밸리(Death Valley)'에 빠져 있습니다.\n\n아티스트의 만성 적자: 예술 활동 월평균 소득은 150.7만 원에 불과하며, 사비로 대관료를 지불하고 노쇼(No-show)의 두려움에 떨어야 합니다." },
    { id: 'what', title: 'WHAT (핵심 컨셉)', content: "최근 Z세대의 핵심 소비 트렌드인 '디깅(Digging, 숨겨진 원석을 깊게 파고드는 행위)'에서 착안한 수요 기반의 인디 공연 유통 플랫폼(OS)입니다.\n\n비플랫폼 기반 O2O 소규모 공연 매칭 서비스 개발. 팬들이 아티스트를 소환하고 결제가 오픈되면 공연이 확정되는 모델 적용." },
    { id: 'who', title: 'WHO (타겟 고객)', content: "1. 큐레이터 및 관객 (2030 디깅 세대)\n2. 공연장 및 복합문화공간 (사업자)\n3. 인디 아티스트 (공급자)" },
    { id: 'how', title: 'HOW TO WIN (경쟁 우위)', content: "독점적 특허 확보: 단순한 중개 앱이 아닌 '특정 지역/장르별 실시간 공연 소환 지수'를 도출하는 '공연 수요 예측 시스템'으로 BM 특허를 출원하여 경쟁사의 진입을 방어합니다." },
    { id: 'agenda', title: '논의 안건', content: "1. 초기 마케팅 비용 조달 방안\n2. 결제 수수료율 책정 기준" }
  ]
};

const initialFeedbacks = [
  { id: 1, sectionId: 'what', author: '김과장(마케팅)', category: '아이디어', text: '소규모 결제 오픈 방식이 크라우드 펀딩 느낌이 강하네요. 팬덤 주도형 이라는 키워드를 강조하고, 티켓팅 100% 달성 시 폭죽이 터지는 등 게이미피케이션 요소를 넣자는 기획을 반영해주세요.', time: '1시간 전' },
  { id: 2, sectionId: 'what', author: 'CTO(개발)', category: '리스크', text: '웹 앱 구조상 티켓팅 동시 접속이 몰릴 경우 트랜잭션 에러 리스크가 큽니다. 대기열 시스템 도입이나 트래픽 분산 설계를 아키텍처에 명시해야 합니다.', time: '30분 전' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('what');
  const [feedbackText, setFeedbackText] = useState('');
  const [category, setCategory] = useState('아이디어 추가');

  // State for overall workspace data
  const [planData, setPlanData] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/workspace')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlanData(data.data.planData);
          setFeedbacks(data.data.feedbacks);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load workspace data:", err);
        setIsLoading(false);
      });
  }, []);

  // Modal state
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const currentSection = planData?.sections?.find(s => s.id === activeTab) || null;
  const currentFeedbacks = feedbacks.filter(f => f.sectionId === activeTab);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !currentSection) return;

    setIsProcessing(true);
    setShowPreview(true);

    try {
      // API call to local Route Handler
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentSection.content,
          feedbackText,
          sectionId: activeTab,
          author: 'PM(나)'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiResponse(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    if (!aiResponse) return;

    const newFeedback = {
      id: Date.now(),
      sectionId: activeTab,
      author: 'PM(나)',
      category: category,
      text: feedbackText,
      time: '방금 전'
    };

    const aiFeedback = {
      id: Date.now() + 1,
      sectionId: activeTab,
      author: 'AI 비서',
      category: '병합됨',
      text: `✅ 방금 전 피드백이 본문에 성공적으로 병합되었습니다. (AI 반영안)`,
      time: '방금 전'
    };

    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MERGE_SECTION',
          payload: {
            sectionId: activeTab,
            newContent: aiResponse.newContent,
            newFeedback,
            aiFeedback
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlanData(data.data.planData);
        setFeedbacks(data.data.feedbacks);
      }
    } catch (e) {
      console.error(e);
    }

    // Close modal & Clean up
    setShowPreview(false);
    setFeedbackText('');
    setAiResponse(null);
  };

  if (isLoading || !planData) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center text-[#ededed]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm text-gray-400">Loading DB Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-blue-500/30">

      {/* Sidebar Navigation */}
      <div className="w-16 md:w-64 border-r border-[#222] bg-[#111] flex flex-col">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-[#222]">
          <span className="font-bold text-xl tracking-tight hidden md:block">DIG<span className="text-blue-500">.</span>Team</span>
          <span className="font-bold text-xl md:hidden">D.</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:block">Workspace</div>
          <a href="#" className="flex items-center px-4 md:px-6 py-3 bg-[#1a1a1a] border-r-2 border-blue-500 text-blue-400">
            <span className="hidden md:block truncate">{planData.title}</span>
          </a>
        </div>

        <div className="p-4 border-t border-[#222] flex items-center justify-center md:justify-start gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">PM</div>
          <div className="hidden md:block text-sm">
            <p className="font-medium">Project Manager</p>
            <p className="text-gray-500 text-xs text-blue-400">120 Tokens</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-6 bg-[#0a0a0a] z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium">{planData.title}</h1>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Draft v1.2</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeftRight size={16} /> <span className="hidden sm:inline">Version History</span>
            </button>
            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <Users size={16} /> <span className="hidden sm:inline">Share</span>
            </button>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Workspace Split Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Panel: Plan Sections (60%) */}
          <div className="w-3/5 flex flex-col border-r border-[#222] bg-[#0a0a0a] relative">

            {/* Tabs */}
            <div className="flex border-b border-[#222] overflow-x-auto hide-scrollbar bg-[#111]">
              {planData.sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === section.id
                    ? 'border-blue-500 text-white bg-[#1a1a1a]'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#151515]'
                    }`}
                >
                  {section.title}
                </button>
              ))}
            </div>

            {/* Read-only Editor Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 relative">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-gray-100">{currentSection?.title}</h2>
                <div className="prose prose-invert max-w-none">
                  {currentSection?.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-gray-300 leading-relaxed text-lg mb-6">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Overlay Lock Indicator */}
            <div className="absolute top-20 right-8 px-3 py-1.5 bg-[#111]/80 backdrop-blur-sm border border-[#333] rounded-md flex items-center gap-2 text-xs text-gray-400">
              Lock: AI Edit Only
            </div>
          </div>

          {/* Right Panel: Feedback Timeline (40%) */}
          <div className="w-2/5 flex flex-col bg-[#111]">

            <div className="p-4 border-b border-[#222] bg-[#151515] flex justify-between items-center">
              <h3 className="font-medium text-sm text-gray-300 flex items-center gap-2">
                <MessageSquarePlus size={16} className="text-blue-400" />
                팀 피드백 스레드
              </h3>
              <span className="text-xs bg-[#222] px-2 py-1 rounded text-gray-400">{currentFeedbacks.length}개의 의견</span>
            </div>

            {/* Feedback List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentFeedbacks.length > 0 ? (
                currentFeedbacks.map(fb => (
                  <div key={fb.id} className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 transition-colors hover:border-[#333]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{fb.author}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-gray-400 border border-[#333]">{fb.category}</span>
                      </div>
                      <span className="text-xs text-gray-500">{fb.time}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{fb.text}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                  <MessageSquarePlus size={24} className="opacity-50" />
                  <p className="text-sm">아직 등록된 피드백이 없습니다.</p>
                </div>
              )}
            </div>

            {/* Feedback Input Form */}
            <div className="p-4 bg-[#0a0a0a] border-t border-[#222]">
              <div className="relative">
                <textarea
                  className="w-full bg-[#111] border border-[#333] rounded-lg p-3 pt-4 text-sm text-white resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  rows="3"
                  placeholder="당신의 날카로운 비판이 프로젝트 리스크를 10% 줄입니다..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <select className="bg-[#1a1a1a] border border-[#333] text-xs text-gray-300 rounded px-2 py-1 focus:outline-none">
                      <option>분류 (RISK, IDEA...)</option>
                      <option>아이디어 추가</option>
                      <option>리스크 지적</option>
                      <option>단순 질문</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackText.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#222] disabled:text-gray-500 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>LLM에 검토 넘기기</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI Preview Modal / Flash Panel (Mock) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#333] w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-400" />
                <h3 className="font-medium text-white">AI 자동 수정 리뷰 (Diff View)</h3>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#222]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#222]">

              {/* Diff Preview */}
              <div className="flex-1 p-6 space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">본문 업데이트 초안</h4>

                <div className="text-sm leading-relaxed p-4 rounded-lg bg-[#0a0a0a] border border-[#222]">
                  <p className="text-gray-400">비플랫폼 기반 O2O 소규모 공연 매칭 서비스 개발. 팬들이 아티스트를 소환하고 결제가 오픈되면 공연이 확정되는 <span className="bg-red-900/30 text-red-400 line-through decoration-red-500/50">모델 적용.</span></p>

                  <p className="mt-4 text-gray-200">비플랫폼 기반 O2O 소규모 공연 매칭 서비스 개발. 팬들이 아티스트를 소환하고 결제가 오픈되면 공연이 확정되는 <span className="bg-green-900/30 text-green-400 font-medium">'팬덤 주도형' 모델을 적용합니다. 펀딩률 100% 달성 시 게이미피케이션 시각 효과를 활용하여 바이럴을 극대화하며, 일시적인 트래픽 폭주 리스크에 대비하기 위해 초기 아키텍처부터 결제 대기열 시스템 및 트래픽 분산(Redis 등) 클라우드 아키텍처를 도입하여 시스템 안정성을 담보합니다.</span></p>
                </div>
              </div>

              {/* AI Impact Assessment */}
              <div className="w-full lg:w-80 p-6 bg-[#151515] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">사업적 리스크·기회 영향도</h4>

                  <div className="space-y-3">
                    {aiResponse?.impacts && aiResponse.impacts.map(imp => {
                      let bgColor = "bg-[#222]";
                      let borderColor = "border-[#333]";
                      let titleColor = "text-gray-200";

                      if (imp.category === 'business') {
                        bgColor = "bg-blue-500/10";
                        borderColor = "border-blue-500/20";
                        titleColor = "text-blue-400";
                      } else if (imp.category === 'risk') {
                        bgColor = "bg-yellow-500/10";
                        borderColor = "border-yellow-500/20";
                        titleColor = "text-yellow-400";
                      }

                      return (
                        <div key={imp.id} className={`flex items-start gap-2 text-sm ${bgColor} border ${borderColor} p-3 rounded`}>
                          <span>{imp.icon}</span>
                          <div>
                            <p className={`font-medium ${titleColor}`}>{imp.title}</p>
                            <p className="text-gray-400 text-xs mt-1">{imp.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <button
                    onClick={handleMerge}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> 본문에 병합 (Merge)
                  </button>
                  <button
                    onClick={() => { setShowPreview(false); setAiResponse(null); }}
                    className="w-full py-2.5 bg-transparent border border-[#333] hover:bg-[#222] text-gray-300 font-medium text-sm rounded transition-colors"
                  >
                    반려 (Reject)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
