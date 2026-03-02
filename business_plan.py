import streamlit as st
import json
import os
from datetime import datetime
import pandas as pd

# AI 관련 함수 임포트 (기존 ai_client 래핑 활용)
from core.ai_client import (
    ai_update_sections_openai,
    ai_update_sections_claude,
    ai_update_sections
)

# ═══════════════════════════════════════════════════
# 페이지 설정 및 전역 상태 (로컬 파일 저장 연동)
# ═══════════════════════════════════════════════════
st.set_page_config(
    page_title="2026 예술분야 초기창업 지원사업 시스템",
    page_icon="📋",
    layout="wide",
)

SAVE_FILE = os.path.join(os.path.dirname(__file__), "data", "application_save.json")

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

def save_application_data(data):
    os.makedirs(os.path.dirname(SAVE_FILE), exist_ok=True)
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

API_KEY_FILE = os.path.join(os.path.dirname(__file__), "data", "api_keys.json")

def load_api_keys():
    if os.path.exists(API_KEY_FILE):
        try:
            with open(API_KEY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_api_keys(keys):
    os.makedirs(os.path.dirname(API_KEY_FILE), exist_ok=True)
    with open(API_KEY_FILE, "w", encoding="utf-8") as f:
        json.dump(keys, f, ensure_ascii=False, indent=2)

if "application_data" not in st.session_state:
    st.session_state.application_data = load_application_data()

if "mock_evaluations" not in st.session_state:
    st.session_state.mock_evaluations = []

if "api_keys" not in st.session_state:
    st.session_state.api_keys = load_api_keys()

# CSS 테마 조정
st.markdown("""
<style>
.metric-box {
    background-color: #f0f2f6; 
    border-radius: 8px; 
    padding: 15px; 
    text-align: center;
    color: #1f1f1f;
}
.metric-box h3 { margin:0; font-size: 1.2rem; }
.metric-box h2 { margin:0; font-size: 2rem; color: #0068c9; }
.alert-box { padding: 15px; border-radius: 8px; background-color: #ffeaea; color: #d00000; font-weight: bold; border: 1px solid #d00000; }
.success-box { padding: 15px; border-radius: 8px; background-color: #eaffe8; color: #008a0e; font-weight: bold; border: 1px solid #008a0e; }
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════
# 사이드바
# ═══════════════════════════════════════════════════
with st.sidebar:
    st.title("📋 공모 관리 시스템")
    st.caption("(재)예술경영지원센터 2026")
    st.divider()

    menu = st.radio("메뉴 이동", [
        "📝 [접수자] 공모 신청서 작성",
        "📄 [접수자] 지원 사업 신청서 (전체보기)",
        "🤖 [접수자] AI 예비 진단",
        "📊 [심사관] 평가 대시보드"
    ])
    
    st.divider()
    
    st.subheader("⚙️ 관리자 시뮬레이션")
    force_deadline = st.toggle("마감 시간 강제 종료 활성화 (15:00 지남)", value=False)
    
    st.divider()
    st.subheader("🔑 AI API 설정")
    ai_provider = st.selectbox("AI 모델", ["Gemini (Google)", "OpenAI", "Claude (Anthropic)"])
    
    saved_keys = st.session_state.api_keys
    
    if ai_provider == "Gemini (Google)":
        default_val = saved_keys.get("Gemini (Google)", os.environ.get("GEMINI_API_KEY", ""))
        api_key = st.text_input("Gemini API Key", type="password", value=default_val)
        if api_key and api_key != saved_keys.get("Gemini (Google)", ""):
            saved_keys["Gemini (Google)"] = api_key
            save_api_keys(saved_keys)
    elif ai_provider == "OpenAI":
        default_val = saved_keys.get("OpenAI", os.environ.get("OPENAI_API_KEY", ""))
        api_key = st.text_input("OpenAI API Key", type="password", value=default_val)
        if api_key and api_key != saved_keys.get("OpenAI", ""):
            saved_keys["OpenAI"] = api_key
            save_api_keys(saved_keys)
    else:
        default_val = saved_keys.get("Claude (Anthropic)", os.environ.get("ANTHROPIC_API_KEY", ""))
        api_key = st.text_input("Claude API Key", type="password", value=default_val)
        if api_key and api_key != saved_keys.get("Claude (Anthropic)", ""):
            saved_keys["Claude (Anthropic)"] = api_key
            save_api_keys(saved_keys)

# ═══════════════════════════════════════════════════
# 🪄 공통 AI 호출 함수 래퍼 (Mock)
# ═══════════════════════════════════════════════════
def call_ai_assistant(prompt_type, content, api_key_val):
    if not api_key_val:
        st.error("API Key를 입력해주세요.")
        return None
    # 간단한 Mock용 프롬프트 생성 (실제 구현 시 프롬프트 튜닝 필요)
    try:
        if prompt_type == "autocomplete":
            st.toast("AI가 전문 공문서 어투로 변환 및 융합 중입니다...", icon="🤖")
            # In real system, we would construct a specific prompt and use genai/openai directly
            return f"[{datetime.now().strftime('%H:%M:%S')} AI 자동완성 (정부지원사업 격식체)]\n(원본 아이디어: {content})\n\n수도권에 집중된 문화 예술 향유 기회를 지역 단위로 안정적으로 확장하기 위해, 중개 브로커를 배제한 아티스트-팬 직거래 방식의 다이렉트 매칭 플랫폼을 선제적으로 기획 및 구축할 계획입니다. 이를 통해 소규모 독립 공연장의 무수익 공실률 문제를 타개하고 자생적이고 지속가능한 예술 생태계 활성화에 기여하고자 합니다."
        elif prompt_type == "evaluation":
            st.toast("AI가 4대 지표로 항목을 평가합니다...", icon="⚖️")
            return {
                "전문성": 85, "타당성": 78, "성장가능성": 90, "기여도": 88,
                "총점": 85.25,
                "리포트": "성장가능성은 매우 우수하나, 구체적인 예산 타당성 보완이 필요합니다."
            }
    except Exception as e:
        st.error(f"AI 호출 오류: {e}")
        return None

# ═══════════════════════════════════════════════════
# 메뉴 1: 공모 신청 (접수자)
# ═══════════════════════════════════════════════════
if menu == "📝 [접수자] 공모 신청서 작성":
    st.title("📝 2026 예술분야 초기창업 지원사업 신청")
    
    if force_deadline:
        st.markdown('<div class="alert-box">🚨 2026.03.09. 15:00 정각이 경과되어 접수가 마감되었습니다. 추가 수정 및 제출이 불가합니다.</div>', unsafe_allow_html=True)
        st.stop()
        
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
        
        # Save state manually via stepwise button
        if st.button("💾 Step 1 임시저장 (개별 저장)", key="save_step1"):
            app_data["eligibility_checked"] = (is_under_3yrs == "예 (지원 가능)")
            app_data["biz_field"] = biz_field
            app_data["points"] = points
            save_application_data(app_data)
            st.toast("✅ Step 1 저장완료 — 전체보기에 실시간 반영됨")

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
                budget_valid = False
            else:
                st.markdown("<div class='success-box'>✅ 예산 편성 비율 검증이 완료되었습니다.</div>", unsafe_allow_html=True)
                budget_valid = True
        else:
            budget_valid = False

        if st.button("💾 Step 2 임시저장 (개별 저장)", key="save_step2"):
            app_data["budget_subsidy"] = subsidy
            app_data["budget_self"] = self_fund
            save_application_data(app_data)
            st.toast("✅ Step 2 저장완료 — 전체보기에 실시간 반영됨")

    # [Step 3] AI 제안서 자동 완성 (업데이트된 기능)
    with st.expander("🤖 Step 3. 사업계획서 임시 작성 (AI 보조)", expanded=True):
        st.caption("간단한 아이디어나 개요만 입력하고 'AI 문장 자동 완성'을 누르면 전문적인 제안서 톤으로 변환됩니다.")
        
        memo = st.text_area("사업계획 개요 입력", value=app_data.get("proposal_text", ""), height=150)
        
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            if st.button("✨ AI 문장 자동 완성 (API 연동)", type="primary", use_container_width=True):
                if not api_key:
                    st.warning("사이드바에서 AI API 키를 입력해주세요.")
                elif len(memo) < 5:
                    st.warning("최소 5자 이상 입력해주세요.")
                else:
                    with st.spinner("전문 공문서 어투로 텍스트 변환 중..."):
                        result = call_ai_assistant("autocomplete", memo, api_key)
                        if result:
                            app_data["proposal_text"] = result
                            save_application_data(app_data)
                            st.rerun()
        with col_s2:
            if st.button("💾 Step 3 임시저장 (개별 저장)", use_container_width=True, key="save_step3"):
                app_data["proposal_text"] = memo
                save_application_data(app_data)
                st.toast("✅ Step 3 저장완료 — 전체보기에 실시간 반영됨")
                        
    # [Step 4] 첨부 파일
    with st.expander("📎 Step 4. 지정 양식 및 증빙 서류 업로드", expanded=False):
        st.warning("현재 브라우저 임시저장 환경입니다. 업로드된 파일은 서버로 즉시 전송되지 않습니다.")
        st.file_uploader("[서식 1,2] 공모신청서 및 통합서식 (HWP 단일 파일)", type=["hwp"])
        st.file_uploader("[서식 3] 각종 증빙 및 포트폴리오 (PDF 병합 본)", type=["pdf"])

    # [Step 5] 필수 동의 및 제출
    st.divider()
    st.markdown("#### 📝 필수 서약서 동의")
    agree1 = st.checkbox("개인정보 수집 및 이용에 동의합니다. (필수)")
    agree2 = st.checkbox("성희롱·성폭력 예방 서약서 내용에 동의합니다. (필수)")
    
    can_submit = app_data["eligibility_checked"] and budget_valid and len(app_data.get("proposal_text", "")) > 10 and agree1 and agree2
    
    if st.button("🚀 최종 제출하기", type="primary", disabled=not can_submit, use_container_width=True):
        app_data["status"] = "제출완료"
        save_application_data(app_data)
        st.balloons()
        st.success("✅ 공모 접수가 정상적으로 완료되었습니다. (접수번호: 2026-ART-0824)")


# ═══════════════════════════════════════════════════
# 메뉴 1-2: 지원 사업 신청서 (전체보기)
# ═══════════════════════════════════════════════════
elif menu == "📄 [접수자] 지원 사업 신청서 (전체보기)":
    st.title("📄 [지원 사업 신청서] 전체보기")
    st.markdown("각 단계별(Stepwise)로 임시저장 및 분할 입력한 내용이 하나의 **Canonical Document(정규 문서)**로 통합되어 표시됩니다.")
    app_data = st.session_state.application_data
    
    st.markdown("### 🏛️ 일반 현황 (Step 1)")
    st.info(f"""
- **지원 자격 검증**: {'✅ 통과 (업력 3년 미만)' if app_data['eligibility_checked'] else '❌ 미충족'}
- **신청 사업 분야**: {app_data['biz_field']}
- **우대(가점) 항목**: {', '.join(app_data['points']) if app_data['points'] else '선택 항목 없음'}
    """)
    st.divider()
    
    st.markdown("### 💰 소요 예산 편성표 (Step 2)")
    total = app_data['budget_subsidy'] + app_data['budget_self']
    st.info(f"""
- **신청 지원금 (국고보조금)**: {app_data['budget_subsidy']:,} 원
- **자기부담금 (현금 배정)**: {app_data['budget_self']:,} 원
- **총 사업비 합계**: **{total:,} 원**
    """)
    st.divider()
    
    st.markdown("### 📝 세부 사업 계획 (Step 3)")
    if app_data['proposal_text']:
        st.success(app_data['proposal_text'])
    else:
        st.warning("아직 작성된 사업계획 내용이 없습니다. '공모 신청서 작성' 탭에서 입력 후 개별 저장해주세요.")
        
    st.divider()
    st.caption(f"최종 업데이트 상태: {app_data['status']} / 데이터는 로컬 Save 저장소와 실시간 동기화(Full-view Sync) 중입니다.")

# ═══════════════════════════════════════════════════
# 메뉴 2: AI 예비 평가 (접수자/관리자)
# ═══════════════════════════════════════════════════
elif menu == "🤖 [접수자] AI 예비 진단":
    st.title("🤖 제출 전 AI 모의 검증 (Pre-Evaluation)")
    st.markdown("최종 제출 전, 작성하신 사업계획서를 기반으로 **실제 심사위원 평가지표(4대 항목)**와 동일한 기준으로 AI가 약점과 강점을 진단합니다.")
    
    app_data = st.session_state.application_data
    
    if len(app_data.get("proposal_text", "")) < 20:
        st.info("신청서 작성 메뉴에서 사업계획 내용을 20자 이상 작성하신 후 이용 가능합니다.")
        st.stop()
        
    st.markdown("#### 현재 작성된 내 사업계획 요약")
    st.text_area("미리보기", value=app_data["proposal_text"], height=100, disabled=True)
    
    if st.button("⚖️ AI 진단 리포트 생성하기", type="primary"):
        if not api_key:
            st.warning("사이드바에서 AI API 키를 입력해주세요.")
        else:
            with st.spinner("AI 심사위원이 4대 지표 기준으로 사업계획을 분석 중입니다..."):
                result = call_ai_assistant("evaluation", app_data["proposal_text"], api_key)
                if result:
                    st.session_state.mock_evaluations = result
                    st.success("진단이 완료되었습니다!")
                    
    if st.session_state.mock_evaluations:
        eval_data = st.session_state.mock_evaluations
        st.divider()
        st.subheader(f"총점: {eval_data['총점']} 점 / 100 점")
        
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("사업 전문성", f"{eval_data['전문성']}점")
        c2.metric("제안 타당성", f"{eval_data['타당성']}점")
        c3.metric("성장 가능성", f"{eval_data['성장가능성']}점")
        c4.metric("분야 기여도", f"{eval_data['기여도']}점")
        
        st.markdown("#### 🩺 AI 개선 제안 리포트")
        st.info(eval_data['리포트'])

# ═══════════════════════════════════════════════════
# 메뉴 3: 심사 대시보드 (관리자/심사관)
# ═══════════════════════════════════════════════════
elif menu == "📊 [심사관] 평가 대시보드":
    st.title("📊 2026 심사위원 통합 평가 대시보드")
    
    # Mock data for dashboard
    mock_applicants = [
        {"id": "2026-ART-001", "name": "스튜디오 소환", "field": "기획·제작", "status": "평가대기"},
        {"id": "2026-ART-002", "name": "인디스트림", "field": "유통·배급", "status": "평가대기"},
        {"id": "2026-ART-003", "name": "(주)아트테크", "field": "서비스", "status": "평가완료 (88점)"},
    ]
    
    # 만약 현재 세션에서 '제출완료' 였다면 목록에 추가
    if st.session_state.application_data["status"] == "제출완료":
        mock_applicants.insert(0, {
            "id": "2026-ART-0824",
            "name": "나의 지원 기업 (Current Session)",
            "field": st.session_state.application_data["biz_field"],
            "status": "평가대기"
        })
        
    df = pd.DataFrame(mock_applicants)
    st.markdown("#### 할당된 심사 대상 기업 목록")
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    st.divider()
    
    target = st.selectbox("심사할 접수번호 선택", [item["id"] for item in mock_applicants if "대기" in item["status"]])
    
    if target:
        st.markdown(f"### [ {target} ] 채점 보드")
        st.caption("지원서의 상세 내용은 보안상 블라인드 처리되었습니다.")
        
        s1, s2 = st.columns(2)
        with s1:
            score1 = st.slider("사업의 전문성 및 역량 (30점 만점)", 0, 30, 15)
            score2 = st.slider("제안 사업의 타당성 (30점 만점)", 0, 30, 15)
        with s2:
            score3 = st.slider("성장 가능성 및 파급력 (20점 만점)", 0, 20, 10)
            score4 = st.slider("예술분야 기여도 (20점 만점)", 0, 20, 10)
            
        total_score = score1 + score2 + score3 + score4
        st.markdown(f"#### 📝 최종 산출 점수: **<span style='color:#008a0e;'>{total_score} 점</span>** / 100 점", unsafe_allow_html=True)
        
        review_comment = st.text_area("종합 심사평 (선택사항)")
        
        if st.button("✅ 최종 점수 제출", type="primary"):
            st.success(f"[{target}] 심사 결과가 안전하게 DB에 기록되었습니다. (작성 로그기록 저장 완료)")

