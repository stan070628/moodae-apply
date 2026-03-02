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
    return {
        "eligibility_checked": False,
        "biz_field": "기획·제작",
        "budget_subsidy": 0,
        "budget_self": 0,
        "points": [],
        "proposal_text": "",
        "status": "작성중"
    }

st.title("📄 2026 예술분야 사업계획서 (전체보기)")
st.caption("✅ 이 화면은 Step 1~3에서 임시저장된 데이터를 실시간으로 모아서 보여주는 통합 뷰어입니다.")

if "application_data" not in st.session_state:
    st.session_state.application_data = load_application_data()

app_data = st.session_state.application_data

st.markdown("### 🏛️ 기본 현황 (Step 1)")
with st.container(border=True):
    col1, col2 = st.columns(2)
    col1.metric("자격: 업력 3년 미만", "✔ 검증 완료" if app_data.get('eligibility_checked') else "❌ 미확인")
    col2.metric("지원 분야", app_data.get('biz_field', '미정'))
    
    selected_points = app_data.get('points', [])
    st.metric(f"우대 가점 ({len(selected_points)}개 적용)", ", ".join(selected_points) if selected_points else "선택된 가점 없음")

st.markdown("<br>", unsafe_allow_html=True)
st.markdown("### 💰 소요 예산 총괄 (Step 2)")
with st.container(border=True):
    total = app_data.get('budget_subsidy', 0) + app_data.get('budget_self', 0)
    c1, c2, c3 = st.columns(3)
    c1.metric("신청 지원금 (국고)", f"{app_data.get('budget_subsidy', 0):,} 원")
    c2.metric("자기부담금 (현금)", f"{app_data.get('budget_self', 0):,} 원")
    c3.metric("총 사업비 합계", f"{total:,} 원")

st.markdown("<br>", unsafe_allow_html=True)

st.markdown("### 📝 세부 사업 계획 (Step 3)")
if app_data['proposal_text']:
    formatted_text = app_data['proposal_text'].replace('\n', '<br>')
    st.markdown(
        f"<div style='line-height: 1.8; margin-top: 10px; padding: 15px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.05); color: #e0e0e0;'>{formatted_text}</div>",
        unsafe_allow_html=True
    )
else:
    st.warning("아직 작성된 사업계획 내용이 없습니다. '공모 신청서 작성' 메뉴에서 입력 후 개별 저장해주세요.")
    
st.divider()
st.caption(f"최종 업데이트 상태: {app_data['status']} / 데이터는 로컬 Save 저장소와 실시간 동기화(Full-view Sync) 중입니다.")
