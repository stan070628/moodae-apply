import streamlit as st
import pandas as pd
import json
import os

st.title("📊 2026 심사위원 통합 평가 대시보드")
st.markdown("심사 대상 프로젝트들에 대한 리스트와 직접 채점을 진행할 수 있는 심사관 전용 화면입니다.")

SAVE_FILE = os.path.join("data", "application_save.json")

def load_application_data():
    if os.path.exists(SAVE_FILE):
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {"status": "작성대기"}

app_data = load_application_data()

# Mock data for dashboard
mock_applicants = [
    {"id": "2026-ART-001", "name": "스튜디오 소환", "field": "기획·제작", "status": "평가대기"},
    {"id": "2026-ART-002", "name": "인디스트림", "field": "유통·배급", "status": "평가대기"},
    {"id": "2026-ART-003", "name": "(주)아트테크", "field": "서비스", "status": "평가완료 (88점)"},
]

# 만약 현재 세션에서 '제출완료' 였다면 목록에 추가
if app_data.get("status") == "제출완료":
    mock_applicants.insert(0, {
        "id": "2026-ART-0824",
        "name": "나의 지원 기업 (Current Session)",
        "field": app_data.get("biz_field", "서비스"),
        "status": "평가대기"
    })
    
df = pd.DataFrame(mock_applicants)
st.markdown("#### 할당된 심사 대상 기업 목록")
st.dataframe(df, use_container_width=True, hide_index=True)

st.divider()

target = st.selectbox("심사할 접수번호 선택", [item["id"] for item in mock_applicants if "대기" in item["status"]])

if target:
    st.markdown(f"### 📋 [ {target} ] 채점 보드")
    st.caption("지원서의 상세 내용은 심사관의 공정도 제고를 위해 블라인드 처리되었습니다.")
    
    s1, s2 = st.columns(2)
    with s1:
        score1 = st.slider("사업의 전문성 및 역량 (30점 만점)", 0, 30, 15)
        score2 = st.slider("제안 사업의 타당성 (30점 만점)", 0, 30, 15)
    with s2:
        score3 = st.slider("성장 가능성 및 파급력 (20점 만점)", 0, 20, 10)
        score4 = st.slider("예술분야 기여도 (20점 만점)", 0, 20, 10)
        
    total_score = score1 + score2 + score3 + score4
    st.markdown(f"#### 📝 산출 합계 점수: **<span style='color:#008a0e;'>{total_score} 점</span>** / 100 점", unsafe_allow_html=True)
    
    review_comment = st.text_area("종합 심사평 (선택사항)")
    
    if st.button("✅ 최종 점수 및 심사평 제출", type="primary"):
        st.success(f"[{target}] 심사 결과가 안전하게 DB에 기록되었습니다. (작성 로그기록 저장 완료)")
