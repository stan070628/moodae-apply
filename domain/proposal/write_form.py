import streamlit as st
import os
import json
import time
from datetime import datetime

from core.ai_resilient_client import AIAPIClient, get_client

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
                POLISH_SYSTEM_PROMPT = (
                    "당신은 정부 지원사업 신청서 작성 전문 컨설턴트입니다.\n"
                    "사용자가 입력한 사업계획 초안을 아래 규칙에 따라 고도화하십시오.\n\n"
                    "1. 원문의 핵심 아이디어와 데이터를 100% 보존할 것.\n"
                    "2. 정부/VC 격식체(~합니다, ~입니다)로 변환할 것.\n"
                    "3. 핵심 전략 키워드와 수치는 **볼드** 처리할 것.\n"
                    "4. 논리 흐름(문제→솔루션→기대효과)을 자연스럽게 정리할 것.\n"
                    "5. 원문에 없는 내용을 추가하거나 지어내지 말 것.\n"
                    "6. 마크다운 형식으로 출력할 것 (단, JSON이 아닌 순수 텍스트).\n"
                    "7. 별도의 설명이나 주석 없이 고도화된 본문 텍스트만 출력할 것."
                )
                user_prompt = f"아래 사업계획 초안을 고도화해 주십시오.\n\n---\n{memo}\n---"

                with st.status("AI 지능형 자율 편집 및 스타일링 진행 중...", expanded=True) as status:
                    st.write("✏️ 전문적인 정부/VC 비즈니스 문체로 최적화 중...")
                    
                    all_keys = st.session_state.get("api_keys", {})
                    
                    # Use resilient AI client with automatic fallback
                    client = get_client({
                        'gemini': all_keys.get('Gemini', ''),
                        'openai': all_keys.get('OpenAI', ''),
                        'anthropic': all_keys.get('Anthropic', ''),
                    })
                    
                    st.write("🔄 3-Tier 폴백 시스템으로 AI 엔진 연결 중...")
                    
                    try:
                        result = client.call(
                            endpoint='gemini',
                            prompt=user_prompt,
                            system=POLISH_SYSTEM_PROMPT,
                            fallback_endpoints=['openai', 'anthropic'],
                            json_mode=False,
                            max_tokens=4096,
                            timeout=30.0,
                            use_cache=True,
                        )
                        
                        updated_text = result.get('content', '').strip()
                        used_engine = result.get('used_endpoint', 'Unknown')
                        from_cache = result.get('from_cache', False)
                        
                        # Map endpoint name to display name
                        engine_display = {
                            'gemini': 'Gemini',
                            'openai': 'OpenAI',
                            'anthropic': 'Anthropic'
                        }.get(used_engine, used_engine)
                        
                        st.write("✨ 핵심 전략 키워드 추출 및 마크다운 스타일링 적용 중...")
                        
                        if updated_text:
                            app_data["proposal_text"] = updated_text
                            save_application_data(app_data)
                            cache_msg = " (캐시)" if from_cache else ""
                            status.update(label=f"스타일링 완료! ({engine_display} 엔진 사용{cache_msg})", state="complete", expanded=False)
                            st.success(f"AI 문장 완성이 완료되었습니다! ({engine_display}{cache_msg})")
                            time.sleep(0.5)
                            st.rerun()
                        else:
                            raise Exception("Empty response from AI")
                            
                    except Exception as e:
                        st.caption(f"⚠️ AI 호출 실패: {e}")
                        status.update(label="AI 호출 실패", state="error", expanded=False)
                        st.error("모든 AI 엔진 호출에 실패했습니다. 사이드바에서 유효한 API 키가 설정되어 있는지 확인해 주세요.")
    with col_s2:
        if st.button("💾 수동 임시저장", use_container_width=True):
            app_data["proposal_text"] = memo
            save_application_data(app_data)
            st.toast("✅ Step 3 저장완료")
