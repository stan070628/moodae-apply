import streamlit as st
import os
import json
from datetime import datetime

# 기존 data 경로 (루트 디렉토리 기준)
SAVE_FILE = os.path.join("data", "application_save.json")

def save_application_data(data):
    os.makedirs(os.path.dirname(SAVE_FILE), exist_ok=True)
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

st.title("📝 2026 예술분야 초기창업 지원사업 신청")

force_deadline = st.session_state.get("force_deadline", False)

def load_application_data():
    if os.path.exists(SAVE_FILE):
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "eligibility_checked": False,
        "biz_field": "기획·제작",
        "budget_subsidy": 0,
        "budget_self": 0,
        "points": [],
        "proposal_text": "",
        "status": "작성중"
    }

if "application_data" not in st.session_state:
    st.session_state.application_data = load_application_data()

app_data = st.session_state.application_data

# [Step 1] 자격 요건 및 가점
with st.expander("✅ Step 1. 자격 검증 및 우대 가점 체크", expanded=True):
    st.markdown("#### 지원 자격 확인")
    is_under_3yrs = st.radio("공고일 기준 창업(업력) 3년 미만의 개인/법인 사업자이십니까?", ["예 (지원 가능)", "아니오 (지원 불가)"], index=0 if app_data["eligibility_checked"] else 1)
    if is_under_3yrs == "아니오 (지원 불가)":
        st.error("❌ 본 사업은 업력 3년 미만의 창업자만 지원 가능합니다.")
        
    st.markdown("#### 지원 분야 선택 (택 1)")
    biz_field = st.selectbox("사업 분야", ["기획·제작", "유통·배급", "서비스", "글로벌 시장확대"], index=["기획·제작", "유통·배급", "서비스", "글로벌 시장확대"].index(app_data["biz_field"]))
    
    st.markdown("#### 우대(가점) 사항")
    points = st.multiselect("해당하는 가점 항목을 선택하세요 (최대 3개)", 
                            ["문화체육관광형 예비사회적기업 (3점)", "비수도권 소재 기업 (2점)", "청년 만 39세 이하 대표자 (2점)", "장애인 기업 (2점)"],
                            default=app_data["points"])
    
    if st.button("💾 Step 1 임시저장 (개별 저장)", key="save_step1"):
        app_data["eligibility_checked"] = (is_under_3yrs == "예 (지원 가능)")
        app_data["biz_field"] = biz_field
        app_data["points"] = points
        save_application_data(app_data)
        st.toast("✅ Step 1 저장완료")

# [Step 2] 예산 편성
with st.expander("💰 Step 2. 총 사업비 입력 및 예산 비율 검증", expanded=True):
    st.info("💡 **예산 편성 기준**: 국고보조금은 총 사업비의 80% 이하, 자기부담금(현금)은 20% 이상이어야 합니다.")
    
    col_b1, col_b2 = st.columns(2)
    with col_b1:
        subsidy = st.number_input("신청 지원금 (국고보조금) [원]", min_value=0, step=1000000, value=app_data.get("budget_subsidy", 0))
    with col_b2:
        self_fund = st.number_input("자기부담금 (현금) [원]", min_value=0, step=1000000, value=app_data.get("budget_self", 0))
        
    total_budget = subsidy + self_fund
    
    b1, b2, b3 = st.columns(3)
    with b1:
        st.markdown(f"<div class='metric-box'><h3>총 사업비</h3><h2>{total_budget:,} 원</h2></div>", unsafe_allow_html=True)
    
    if total_budget > 0:
        sub_ratio = (subsidy / total_budget) * 100
        self_ratio = (self_fund / total_budget) * 100
        
        with b2:
            color = "#d00000" if sub_ratio > 80 else "#008a0e"
            st.markdown(f"<div class='metric-box'><h3>국고 비율</h3><h2 style='color:{color};'>{sub_ratio:.1f}%</h2></div>", unsafe_allow_html=True)
        with b3:
            color = "#d00000" if self_ratio < 20 else "#008a0e"
            st.markdown(f"<div class='metric-box'><h3>자기부담 비율</h3><h2 style='color:{color};'>{self_ratio:.1f}%</h2></div>", unsafe_allow_html=True)
        
        if self_ratio < 20:
            st.markdown("<div class='alert-box'>🚨 [에러] 자기부담금(현금) 비율이 20% 미만입니다. 예산을 다시 편성해 주십시오.</div>", unsafe_allow_html=True)
        else:
            st.markdown("<div class='success-box'>✅ 예산 편성 비율 검증이 완료되었습니다.</div>", unsafe_allow_html=True)

    if st.button("�� Step 2 임시저장 (개별 저장)", key="save_step2"):
        app_data["budget_subsidy"] = subsidy
        app_data["budget_self"] = self_fund
        save_application_data(app_data)
        st.toast("✅ Step 2 저장완료")

# [Step 3] AI 제안서 자동 완성 (업데이트된 기능)
with st.expander("🤖 Step 3. 사업계획서 임시 작성 (AI 보조)", expanded=True):
    st.caption("간단한 아이디어나 개요만 입력하고 'AI 문장 자동 완성'을 누르면 전문적인 제안서 톤으로 변환됩니다.")
    
    memo = st.text_area("사업계획 개요 입력", value=app_data.get("proposal_text", ""), height=150)
    
    col_s1, col_s2 = st.columns(2)
    with col_s1:
        if st.button("✨ AI 문장 자동 완성 (API 연동)", type="primary", use_container_width=True):
            api_key = st.session_state.get("current_api_key", "")
            if not api_key:
                st.warning("사이드바에서 AI API 키를 입력해주세요.")
            elif len(memo) < 5:
                st.warning("최소 5자 이상 입력해주세요.")
            else:
                with st.spinner("전문 공문서 어투로 텍스트 변환 중..."):
                    # Mock AI update
                    updated_text = f"[{datetime.now().strftime('%H:%M:%S')} AI 자동완성 (정부지원사업 격식체)]\n(원본 아이디어: {memo})\n\n수도권에 집중된 문화 예술 향유 기회를 지역 단위로 안정적으로 확장하기 위해, 중개 브로커를 배제한 아티스트-팬 직거래 방식의 다이렉트 매칭 플랫폼을 선제적으로 기획 및 구축할 계획입니다."
                    app_data["proposal_text"] = updated_text
                    save_application_data(app_data)
                    st.success("AI 문장 완성이 완료되었습니다!")
                    st.rerun()
    with col_s2:
        if st.button("💾 수동 임시저장", use_container_width=True):
            app_data["proposal_text"] = memo
            save_application_data(app_data)
            st.toast("✅ Step 3 저장완료")
