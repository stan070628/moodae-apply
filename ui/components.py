"""
무대소환 시스템 공통 UI / CSS 컴포넌트 모듈
"""
import streamlit as st

def apply_common_styles():
    """앱 전반에 적용되는 공통 CSS 스타일"""
    st.markdown("""
<style>
/* app.py 기본 스타일 */
.metric-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px 16px;
    border-left: 4px solid #4c8bf5;
}
.warn-box {
    background: #fff8e1;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 6px 0;
}
.section-header {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a2e;
}

/* business_plan.py 프레젠테이션 및 카드 스타일 */
.slide-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px; padding: 40px; color: white;
    margin: 16px 0; min-height: 400px;
}
.slide-card h1, .slide-card h2, .slide-card h3 { color: white; }
.slide-title {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px; padding: 60px 40px; color: white;
    text-align: center; min-height: 400px;
    display: flex; flex-direction: column; justify-content: center;
}
.slide-title h1 { color: white; font-size: 2.5rem; }
.slide-title p { color: #a0aec0; font-size: 1.2rem; }

/* Phone Mockup 스타일 */
.mockup-phone {
    background: #1a1a2e; border-radius: 24px; padding: 12px;
    max-width: 280px; margin: 0 auto; border: 3px solid #333;
}
.mockup-screen {
    background: #0f0f23; border-radius: 16px; padding: 16px;
    min-height: 480px; color: white; font-size: 0.85rem;
}
.mockup-screen .header { text-align: center; padding: 12px 0; font-size: 1.1rem; font-weight: bold; }
.mockup-screen .gauge-bar {
    background: #2d2d44; border-radius: 8px; height: 24px; margin: 8px 0; overflow: hidden;
}
.mockup-screen .gauge-fill {
    background: linear-gradient(90deg, #667eea, #764ba2);
    height: 100%; border-radius: 8px; width: 73%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: bold;
}
.mockup-screen .btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px; padding: 10px; text-align: center;
    margin: 6px 0; font-weight: bold; cursor: pointer;
}
.mockup-screen .card {
    background: #1e1e3a; border-radius: 10px; padding: 10px; margin: 6px 0;
}
.kpi-card {
    background: #f8f9fa; border-radius: 12px; padding: 20px;
    border-left: 4px solid #667eea; text-align: center;
}
.process-step {
    background: #f0f4ff; border: 2px solid #667eea; border-radius: 12px;
    padding: 16px; text-align: center; margin: 4px;
}
.process-arrow { font-size: 2rem; color: #667eea; text-align: center; padding: 8px; }
</style>
""", unsafe_allow_html=True)


def render_phone_mockup(screen_type="summon"):
    """휴대폰 목업 UI 반환 (HTML 문자열)"""
    if screen_type == "summon":
        return """
<div class="mockup-phone">
<div class="mockup-screen">
  <div class="header">🎭 무대소환</div>
  <div class="card">
    <div style="font-weight:bold;">🎤 파란노을 — 홍대 소환</div>
    <div style="color:#a0aec0;font-size:0.75rem;">홍대 라이브클럽 FF · 2026.05.15</div>
    <div class="gauge-bar"><div class="gauge-fill">73%</div></div>
    <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#a0aec0;">
      <span>37/50명</span><span>D-12</span>
    </div>
  </div>
  <div class="card">
    <div style="font-weight:bold;">🎧 서울전자음악단 — 이태원</div>
    <div style="color:#a0aec0;font-size:0.75rem;">언더그라운드 · 2026.05.22</div>
    <div class="gauge-bar"><div class="gauge-fill" style="width:45%;">45%</div></div>
    <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#a0aec0;">
      <span>23/50명</span><span>D-19</span>
    </div>
  </div>
  <div class="btn">🔮 새로운 소환 시작하기</div>
  <div class="btn" style="background:#2d2d44;">🎫 AI 초대장 만들기</div>
</div>
</div>"""
    elif screen_type == "invite":
        return """
<div class="mockup-phone">
<div class="mockup-screen">
  <div class="header">✨ AI 초대장</div>
  <div style="text-align:center;padding:20px 0;">
    <div style="font-size:3rem;">🎤</div>
    <div style="font-size:1.2rem;font-weight:bold;margin:8px 0;">파란노을 소환 공연</div>
    <div style="color:#a0aec0;">2026.05.15 · 홍대 라이브클럽 FF</div>
  </div>
  <div class="card" style="text-align:center;">
    <div style="font-size:0.8rem;color:#a0aec0;">나의 초대 기여도</div>
    <div style="font-size:1.5rem;font-weight:bold;color:#667eea;">12명 유입</div>
    <div style="font-size:0.7rem;color:#a0aec0;">예상 T2E 리워드: 4,500원</div>
  </div>
  <div class="btn">📱 인스타 스토리 공유</div>
  <div class="btn" style="background:#FEE500;color:#333;">💬 카카오톡 공유</div>
  <div class="btn" style="background:#2d2d44;">🔗 링크 복사</div>
</div>
</div>"""
    elif screen_type == "venue":
        return """
<div class="mockup-phone">
<div class="mockup-screen">
  <div class="header">🏛️ 공간 대시보드</div>
  <div class="card">
    <div style="font-weight:bold;">📊 이번 달 현황</div>
    <div style="display:flex;justify-content:space-around;margin-top:8px;">
      <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:bold;color:#667eea;">4회</div><div style="font-size:0.65rem;color:#a0aec0;">소환 공연</div></div>
      <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:bold;color:#48bb78;">87%</div><div style="font-size:0.65rem;color:#a0aec0;">가동률</div></div>
      <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:bold;color:#ed8936;">5.0M</div><div style="font-size:0.65rem;color:#a0aec0;">추가수익</div></div>
    </div>
  </div>
  <div class="card">
    <div style="font-weight:bold;">📋 대기 중 소환</div>
    <div style="font-size:0.8rem;color:#a0aec0;margin-top:4px;">재즈 트리오 · 수요일 19시 · 게이지 89%</div>
    <div style="font-size:0.8rem;color:#a0aec0;">인디 밴드 · 토요일 20시 · 게이지 62%</div>
  </div>
  <div class="btn">✅ 소환 수락</div>
  <div class="btn" style="background:#2d2d44;">📅 가용 시간 설정</div>
</div>
</div>"""
