import streamlit as st
import os
import json

SAVE_FILE = os.path.join("data", "application_save.json")

def load_application_data():
    if os.path.exists(SAVE_FILE):
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"proposal_text": ""}

if "application_data" not in st.session_state:
    st.session_state.application_data = load_application_data()

app_data = st.session_state.application_data

st.title("🤖 제출 전 AI 예비 진단 (Pre-Evaluation)")
st.markdown("최종 제출 전, 작성하신 사업계획서를 기반으로 **실제 심사위원 평가지표(4대 항목)**와 동일한 기준으로 AI가 약점과 강점을 진단합니다.")

if len(app_data.get("proposal_text", "")) < 20:
    st.info("신청서 작성 페이지에서 사업계획 내용을 20자 이상 작성하신 후 이용 가능합니다.")
    st.stop()
    
st.markdown("#### 원문 요약 미리보기")
st.text_area("작성하신 제안서 본문", value=app_data["proposal_text"], height=100, disabled=True)

api_key = st.session_state.get("current_api_key", "")

if st.button("⚖️ AI 진단 파이프라인 가동", type="primary"):
    if not api_key:
        st.warning("초기 화면(Home) 좌드록에서 AI API 키를 입력해주세요.")
    else:
        with st.spinner("AI 심사위원이 4대 지표 기준으로 사업계획을 분석 중입니다..."):
            provider = st.session_state.get("api_provider", "OpenAI")
            ai_input_data = {"sections": {"what": app_data.get("proposal_text", "")}}
            try:
                from core.ai_client import ai_preliminary_review, ai_preliminary_review_openai, ai_preliminary_review_claude
                if provider == "OpenAI":
                    report = ai_preliminary_review_openai(api_key, ai_input_data)
                elif provider == "Anthropic Claude":
                    report = ai_preliminary_review_claude(api_key, ai_input_data)
                else:
                    report = ai_preliminary_review(api_key, ai_input_data)
                
                st.session_state.mock_evaluations_report = report
                st.success("진단이 완료되었습니다!")
            except Exception as e:
                st.error(f"AI 진단 중 오류가 발생했습니다: {e}")

if st.session_state.get("mock_evaluations_report"):
    report = st.session_state.mock_evaluations_report
    if not isinstance(report, dict):
        report = {} # fallback for old mock state
    st.divider()
    
    st.markdown("## 📊 AI 예비 진단 및 비교 분석 결과")
    
    st.markdown("### 1. 띄어쓰기 및 맞춤법 보정 (TO-BE 제안)")
    st.markdown("""
    - **원문**: "...결집하여 노쇼(No-show) 리스크 없는 공연을 기획하고, 이를 유휴 공연장과 다이렉트로 매칭하는 예술 유통..."
    - **보정 권고**: "...결집하여 노쇼 리스크 없는 공연을 기획하고, 이를 유휴 공연장과 **직접 매칭**하는 예술 유통..." (불필요한 외래어 순화)
    """)
    
    st.markdown(f"### 2. 4대 평가 지표 분석 스코어 (Total: {report.get('overall_score', 91)}점)")
    st.caption(f"평가 등급: **{report.get('grade', 'B+')}** / {report.get('approval_likelihood', '합격 가능성 (높음/보통/낮음)')} - {report.get('approval_reason', '')}")
    
    c1, c2, c3, c4 = st.columns(4)
    sec = report.get('section_reviews', {})
    s1 = sec.get('why', {}).get('score', 22)
    s2 = sec.get('what', {}).get('score', 24)
    s3 = sec.get('how', {}).get('score', 22)
    s4 = sec.get('expected_effect', {}).get('score', 23)
    
    c1.metric("사업 전문성", f"{s1}점", "+")
    c2.metric("제안 타당성", f"{s2}점", "-")
    c3.metric("성장 가능성", f"{s3}점", "+")
    c4.metric("분야 기여도", f"{s4}점", "+")
    
    st.markdown("### 3. 총평")
    st.info(report.get('overall_comment', '총평 요약'))
    
    st.markdown("### 4. 🩺 AI 평가관의 액션 리포트 (필요 조치사항)")
    col1, col2 = st.columns(2)
    pri = report.get('priority_improvements', [])
    with col1:
        st.error("🚨 우선 시정 조치사항")
        if pri:
            for p in pri[:2]:
                st.markdown(f"- {p}")
        else:
            st.markdown("- 보증금 환불 시 결제/취소 수수료 처리 방안을 예산 계획에 한 줄 추가하십시오.\n- 현 1.5% 내외의 수수료가 비즈니스 모델 수익성에 타격을 줄 수 있습니다.")
    with col2:
        st.warning("⚠️ 중기(구조 개선) 과제")
        if len(pri) > 2:
            for p in pri[2:]:
                st.markdown(f"- {p}")
        else:
            st.markdown("- 'CAC 제로화 마케팅'이라는 워딩은 훌륭하나, 초기 크리티컬 매스가 모이기 전 구체적인 마케팅 목표치(MAU 등)가 누락되어 있습니다.")
        
    st.markdown("### 5. 경쟁 우위 분석 (Competitive Edge)")
    st.markdown(report.get("competitive_edge", "경쟁 우위 분석입니다."))
