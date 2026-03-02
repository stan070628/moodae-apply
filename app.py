import streamlit as st
import os
import json

st.set_page_config(
    page_title="🎭 무대소환 사업계획서 시스템",
    page_icon="🎭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# 기본 경로 세팅
os.makedirs("data", exist_ok=True)

# ═══════════════════════════════════════════════════
# 전역 사이드바 (모든 페이지 공통 노출)
# ═══════════════════════════════════════════════════
with st.sidebar:
    st.title("🎭 무대소환(Stage Summon)")
    st.caption("초기창업 지원사업 통합 관리 시스템 v1.0")
    st.divider()

    st.subheader("🔑 AI 설정")
    ai_provider = st.radio(
        "AI 엔진 선택", 
        ["Google Gemini", "OpenAI", "Anthropic Claude"], 
        captions=[
            "[🔑 발급하기](https://aistudio.google.com/app/apikey)", 
            "[🔑 발급하기](https://platform.openai.com/api-keys)", 
            "[🔑 발급하기](https://console.anthropic.com/settings/keys)"
        ],
        horizontal=True
    )
    
    API_KEY_FILE = os.path.join("data", "api_keys.json")
    def load_apikeys():
        if os.path.exists(API_KEY_FILE):
            with open(API_KEY_FILE, "r") as f: return json.load(f)
        return {}
        
    def save_apikeys(k):
        with open(API_KEY_FILE, "w") as f: json.dump(k, f, indent=2)
        
    keys = load_apikeys()
    
    provider_map = {"Google Gemini": "Gemini", "OpenAI": "OpenAI", "Anthropic Claude": "Anthropic"}
    current_key_name = provider_map[ai_provider]
    
    val = st.text_input(f"{current_key_name} API Key", type="password", value=keys.get(current_key_name, ""))
    
    c1, c2 = st.columns(2)
    with c1:
        if st.button("💾 저장/수정", use_container_width=True):
            keys[current_key_name] = val
            save_apikeys(keys)
            st.toast(f"{current_key_name} API 키가 저장/수정되었습니다!", icon="✅")
    with c2:
        if st.button("🗑️ 삭제", use_container_width=True):
            if current_key_name in keys:
                del keys[current_key_name]
                save_apikeys(keys)
                st.toast(f"{current_key_name} API 키가 삭제되었습니다.", icon="🗑️")
            else:
                st.toast("저장된 키가 없습니다.", icon="⚠️")
                
    st.session_state.current_api_key = keys.get(current_key_name, "")
    st.session_state.api_provider = current_key_name
        
    st.divider()
    st.caption("※ API Key는 로컬스토리지(api_keys.json)에만 암호화 없이 저장되므로 주의 바랍니다.")

# ═══════════════════════════════════════════════════
# 멀티페이지 라우팅 선언
# ═══════════════════════════════════════════════════
pg_write = st.Page("domain/proposal/write_form.py", title="1. 공모 신청서 작성", icon="📝")
pg_view = st.Page("domain/proposal/view_full.py", title="2. 전체 제출 내용 보기", icon="📄")
pg_diag = st.Page("domain/evaluation/ai_diagnostic.py", title="3. AI 예비 진단 (접수자용)", icon="🤖")
pg_dash = st.Page("domain/evaluation/eval_dashboard.py", title="4. 심사위원 평가 보드", icon="📊")
pg_admin = st.Page("domain/admin/version_manager.py", title="5. AI 버전 관리자 설정", icon="⚙️")

pg = st.navigation({
    "접수자 메뉴": [pg_write, pg_view, pg_diag],
    "심사관/관리자 메뉴": [pg_dash, pg_admin]
})

from ui.components import apply_common_styles
try:
    apply_common_styles()
except Exception:
    pass

pg.run()
