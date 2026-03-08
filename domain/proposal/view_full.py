import streamlit as st
import os
import json
import markdown

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

st.markdown("""
<!-- 에디터 참고: "5. AI버전 관리자 설정"의 문장 구조, 글자 크기 등 레이아웃을 그대로 적용할 것 -->
### 📝 세부 사업 계획 (Step 3)

본 사업의 핵심이 되는 세부적인 실행 계획 및 목표 사항입니다.

**[목표]**
본 프로젝트가 달성하고자 하는 궁극적인 목표와 정성/정량적 기대수준을 명시합니다.

**[수행방법]**
목표 달성을 위한 구체적인 프로세스, 인력 활용 계획 및 타임라인을 나타냅니다.

**[예상성과]**
프로젝트 종료 후 예상되는 직접적인 기대효과 및 수치화 가능한 아웃풋입니다.
""", unsafe_allow_html=True)

if app_data['proposal_text']:
    # 마크다운을 HTML로 변환 (**, #, 등의 마크다운 문법을 올바르게 렌더링)
    html_content = markdown.markdown(
        app_data['proposal_text'],
        extensions=['extra', 'nl2br', 'sane_lists']
    )
    st.markdown(
        f"""<div style='line-height: 1.8; margin-top: 10px; padding: 20px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.05); color: #e0e0e0;'>
            <style>
                .md-content h1, .md-content h2, .md-content h3 {{ color: #3b82f6; margin-top: 1em; margin-bottom: 0.5em; }}
                .md-content h1 {{ font-size: 1.5em; border-bottom: 1px solid #333; padding-bottom: 0.3em; }}
                .md-content h2 {{ font-size: 1.3em; }}
                .md-content h3 {{ font-size: 1.1em; }}
                .md-content strong {{ color: #60a5fa; }}
                .md-content ul, .md-content ol {{ margin-left: 1.5em; margin-bottom: 1em; }}
                .md-content li {{ margin-bottom: 0.3em; }}
                .md-content p {{ margin-bottom: 0.8em; }}
            </style>
            <div class="md-content">{html_content}</div>
        </div>""",
        unsafe_allow_html=True
    )
else:
    st.warning("아직 작성된 사업계획 내용이 없습니다. '공모 신청서 작성' 메뉴에서 입력 후 개별 저장해주세요.")
    
st.divider()
st.caption(f"최종 업데이트 상태: {app_data['status']} / 데이터는 로컬 Save 저장소와 실시간 동기화(Full-view Sync) 중입니다.")
