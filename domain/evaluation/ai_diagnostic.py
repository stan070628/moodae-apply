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

st.markdown("### 🤖 AI 예비 진단 (접수자용)")
st.markdown(
    "제출 전에 AI가 사업계획서를 **4대 평가 지표**로 자동 채점하여 보완점과 전략 리포트를 제공합니다.\n\n"
    "- **지표1** 전문성 및 역량 (30점)\n"
    "- **지표2** 제안 사업의 타당성 (30점)\n"
    "- **지표3** 성장 가능성 및 파급력 (20점)\n"
    "- **지표4** 예술분야 기여도 (20점)"
)

if len(app_data.get("proposal_text", "")) < 20:
    st.info("신청서 작성 페이지에서 사업계획 내용을 20자 이상 작성하신 후 이용 가능합니다.")
    st.stop()

st.markdown("#### 원문 요약 미리보기")
st.text_area("작성하신 제안서 본문", value=app_data["proposal_text"], height=100, disabled=True)

if st.button("⚖️ AI 자동 채점 파이프라인 가동", type="primary"):
    api_keys = st.session_state.get("api_keys", {})
    if not any(api_keys.values()):
        st.warning("초기 화면(Home) 좌측에서 AI API 키(Gemini, OpenAI, Anthropic 중 최소 1개)를 입력해 주세요.")
    else:
        with st.status("AI 4대 지표 자동 채점 파이프라인 가동 중...", expanded=True) as status:
            ai_input_data = {"sections": {"what": app_data.get("proposal_text", "")}}
            try:
                from core.ai_client import ai_preliminary_review, ai_preliminary_review_openai, ai_preliminary_review_claude

                report = None
                used_engine = None

                # 1단계 (Primary - Gemini)
                if "Gemini" in api_keys and api_keys["Gemini"]:
                    st.write("🔍 [1/4] 전문성 및 역량 지표 분석 중... (0%)")
                    st.write("📊 [2/4] 제안 사업 타당성 검증 중... (25%)")
                    try:
                        report = ai_preliminary_review(api_keys["Gemini"], ai_input_data)
                        if report.get("_error_type") == "RATE_LIMIT":
                            raise Exception("Gemini API 할당량 초과 (429)")
                        st.write("📈 [3/4] 성장 가능성 및 USP 독창성 분석 중... (50%)")
                        st.write("🎨 [4/4] 예술분야 기여도 측정 중... (75%)")
                        st.write("✅ 리포트 생성 완료 (100%)")
                        used_engine = "Gemini 2.5 Pro"
                        status.update(label=f"분석 완료! ({used_engine} 사용)", state="complete", expanded=False)
                    except Exception as e:
                        st.warning(f"⚠️ Gemini 엔진 오류 ({e}). 2단계(OpenAI)로 전환합니다.")

                # 2단계 (Secondary - OpenAI)
                if not used_engine and "OpenAI" in api_keys and api_keys["OpenAI"]:
                    st.write("🔍 [1/4] 전문성 및 역량 지표 분석 중... (0%)")
                    st.write("📊 [2/4] 제안 사업 타당성 검증 중... (25%)")
                    try:
                        report = ai_preliminary_review_openai(api_keys["OpenAI"], ai_input_data)
                        st.write("📈 [3/4] 성장 가능성 및 USP 독창성 분석 중... (50%)")
                        st.write("🎨 [4/4] 예술분야 기여도 측정 중... (75%)")
                        st.write("✅ 리포트 생성 완료 (100%)")
                        used_engine = "OpenAI GPT-4o"
                        status.update(label=f"분석 완료! ({used_engine} 사용)", state="complete", expanded=False)
                    except Exception as e:
                        st.warning(f"⚠️ OpenAI 엔진 오류 ({e}). 3단계(Claude)로 전환합니다.")

                # 3단계 (Tertiary - Claude)
                if not used_engine and "Anthropic" in api_keys and api_keys["Anthropic"]:
                    st.write("🔍 [1/4] 전문성 및 역량 지표 분석 중... (0%)")
                    st.write("📊 [2/4] 제안 사업 타당성 검증 중... (25%)")
                    try:
                        report = ai_preliminary_review_claude(api_keys["Anthropic"], ai_input_data)
                        st.write("📈 [3/4] 성장 가능성 및 USP 독창성 분석 중... (50%)")
                        st.write("🎨 [4/4] 예술분야 기여도 측정 중... (75%)")
                        st.write("✅ 리포트 생성 완료 (100%)")
                        used_engine = "Anthropic Claude 3.5 Sonnet"
                        status.update(label=f"분석 완료! ({used_engine} 사용)", state="complete", expanded=False)
                    except Exception as e:
                        st.error(f"⚠️ Claude 엔진 오류 ({e}). 모든 AI 엔진 가동에 실패했습니다.")

                if used_engine:
                    st.session_state.diagnostic_report = report
                    st.success(f"{used_engine} 엔진으로 자동 채점이 완료되었습니다!")
                else:
                    status.update(label="분석 실패", state="error", expanded=False)
                    st.error("가용 가능한 모든 AI 엔진 호출에 실패했거나, 등록된 API Key가 유효하지 않습니다.")
            except Exception as e:
                status.update(label="시스템 오류", state="error", expanded=False)
                st.error(f"파이프라인 실행 중 치명적 오류가 발생했습니다: {e}")

# ═══════════════════════════════════════════════════
# 결과 렌더링
# ═══════════════════════════════════════════════════
if st.session_state.get("diagnostic_report"):
    report = st.session_state.diagnostic_report
    if not isinstance(report, dict):
        report = {}

    st.divider()
    st.markdown("## 📊 AI 자동 채점 결과")

    # 429 / RATE_LIMIT 에러 처리
    if report.get("_error_type") == "RATE_LIMIT":
        st.error("🚨 API 할당량 초과 — 잠시 후 다시 시도해 주세요. (429 Rate Limit)", icon="🚨")
        if st.button("다시 시도"):
            del st.session_state["diagnostic_report"]
            st.rerun()
        st.stop()

    # ── 종합 점수 헤더 ──
    overall = report.get("overall_score", 0)
    grade = report.get("grade", "—")
    likelihood = report.get("approval_likelihood", "—")
    reason = report.get("approval_reason", "")

    col_score, col_grade, col_like = st.columns(3)
    col_score.metric("종합 점수", f"{overall}점 / 100점")
    col_grade.metric("평가 등급", grade)
    col_like.metric("합격 가능성", likelihood)

    st.info(report.get("overall_comment", ""))

    st.divider()

    # ── 4대 지표 스코어카드 ──
    st.markdown("### 📋 4대 지표별 AI 자동 채점 결과")

    indicators = report.get("indicators", {})
    ind_order = [
        ("ind1_expertise",  "전문성 및 역량",       30, "🏅"),
        ("ind2_feasibility","제안 사업의 타당성",    30, "📐"),
        ("ind3_growth",     "성장 가능성 및 파급력", 20, "📈"),
        ("ind4_art",        "예술분야 기여도",       20, "🎨"),
    ]

    for key, default_label, max_score, icon in ind_order:
        ind = indicators.get(key, {})
        score = ind.get("score", 0)
        label = ind.get("label", default_label)
        basis = ind.get("algorithm_basis", "")
        strengths = ind.get("strengths", [])
        weaknesses = ind.get("weaknesses", [])
        improvement = ind.get("improvement", "")

        with st.container(border=True):
            h_col, p_col = st.columns([3, 1])
            with h_col:
                st.markdown(f"#### {icon} {label}")
                st.caption(f"산출 근거: {basis}")
            with p_col:
                st.metric("점수", f"{score} / {max_score}")

            st.progress(score / max_score, text=f"{score}/{max_score}점")

            if strengths or weaknesses:
                s_col, w_col = st.columns(2)
                with s_col:
                    if strengths:
                        st.markdown("**강점**")
                        for s in strengths:
                            st.markdown(f"- {s}")
                with w_col:
                    if weaknesses:
                        st.markdown("**약점**")
                        for w in weaknesses:
                            st.markdown(f"- {w}")

            if improvement:
                st.markdown(f"**개선 제안:** {improvement}")

    st.divider()

    # ── 필수 조건 검증 ──
    st.markdown("### ✅ 필수 조건 검증 (Validation Check)")
    vc = report.get("validation_check", {})
    vc_labels = {
        "recurring_bm":     "반복 수익 구조(BM) 확보",
        "art_ecosystem":    "예술 생태계 기여도 명시",
        "fund_ratio":       "자기부담금 20% 이상 편성",
        "scaleup_roadmap":  "3년 Scale-up 로드맵 포함",
    }
    v_cols = st.columns(4)
    for i, (vk, vlabel) in enumerate(vc_labels.items()):
        v = vc.get(vk, {})
        passed = v.get("pass", False)
        comment = v.get("comment", "")
        with v_cols[i]:
            icon_str = "✅" if passed else "❌"
            st.markdown(f"**{icon_str} {vlabel}**")
            if comment:
                st.caption(comment)

    st.divider()

    # ── AI 고도화 전략 리포트 ──
    st.markdown("### 🧠 AI 고도화 전략 리포트")
    st.markdown(
        "*정부/VC 레퍼런스 대조 결과를 바탕으로 AI가 생성한 종합 전략 제언입니다.*"
    )
    strategy = report.get("ai_strategy_report", "")
    if strategy and strategy != "N/A":
        st.markdown(strategy)
    else:
        st.info("전략 리포트 데이터가 없습니다.")

    # ── 우선 보완 사항 ──
    st.divider()
    st.markdown("### 🩺 우선 보완 사항")
    pri = report.get("priority_improvements", [])
    if pri:
        for i, p in enumerate(pri, 1):
            st.markdown(f"**{i}.** {p}")
    else:
        st.info("보완 사항 없음")

    # ── 경쟁 우위 분석 ──
    if report.get("competitive_edge") and report["competitive_edge"] != "N/A":
        st.divider()
        st.markdown("### 🏆 경쟁 우위 분석 (Competitive Edge)")
        st.markdown(report["competitive_edge"])
