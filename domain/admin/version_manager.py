import streamlit as st
import time

# 라우트 가드 (Route Guard)
st.toast("해당 메뉴는 더 이상 제공되지 않습니다.", icon="⚠️")
time.sleep(1)
st.switch_page("domain/proposal/write_form.py")
