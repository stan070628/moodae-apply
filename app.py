"""
무대소환(Stage Summon) 사업계획서 AI 관리 시스템
- Streamlit Entrypoint
"""

import streamlit as st
import json
import os
from datetime import datetime

from core.prompts import SECTION_KEYS, SECTION_NAMES
from data.repository import load_versions, save_version, get_or_create_latest, bump_version
from utils.text_parser import apply_diff_update

from core.ai_client import (
    ai_update_sections, ai_preliminary_review, ai_update_sections_diff,
    ai_update_sections_openai, ai_preliminary_review_openai, ai_update_sections_diff_openai,
    ai_update_sections_claude, ai_preliminary_review_claude, ai_update_sections_diff_claude
)

# ═══════════════════════════════════════════════════
# 페이지 설정
# ═══════════════════════════════════════════════════
st.set_page_config(
    page_title="🎭 무대소환 사업계획서 AI",
    page_icon="🎭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ═══════════════════════════════════════════════════
# CSS 스타일
# ═══════════════════════════════════════════════════
st.markdown("""
<style>
.metric-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px 16px;
    border-left: 4px solid #4c8bf5;
}
.warn-box {
    background: #fff8e1;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 6px 0;
}
.section-header {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a2e;
}
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════
# 사이드바
# ═══════════════════════════════════════════════════
with st.sidebar:
    st.title("🎭 무대소환")
    st.caption("사업계획서 AI 관리 시스템 v0.1")

    st.divider()

    # ── API Key ──
    st.subheader("🔑 API 설정")
    ai_provider = st.radio(
        "AI 제공자 선택",
        ["Gemini (Google)", "OpenAI", "Claude (Anthropic)"],
        horizontal=True,
        key="ai_provider",
    )

    if ai_provider == "Gemini (Google)":
        api_key = st.text_input(
            "Google Gemini API Key",
            type="password",
            value=os.environ.get("GEMINI_API_KEY", ""),
            help="https://aistudio.google.com 에서 무료 발급",
            placeholder="AIza...",
        )
        openai_key = ""
        claude_key = ""
    elif ai_provider == "OpenAI":
        api_key = ""
        openai_key = st.text_input(
            "OpenAI API Key",
            type="password",
            value=os.environ.get("OPENAI_API_KEY", ""),
            help="https://platform.openai.com/api-keys 에서 발급",
            placeholder="sk-...",
        )
        claude_key = ""
    else:
        api_key = ""
        openai_key = ""
        claude_key = st.text_input(
            "Anthropic API Key",
            type="password",
            value=os.environ.get("ANTHROPIC_API_KEY", ""),
            help="https://console.anthropic.com 에서 발급",
            placeholder="sk-ant-...",
        )

    st.divider()

    # ── 버전 관리 ──
    st.subheader("📁 버전 관리")
    all_versions = load_versions()

    if not all_versions:
        plan = get_or_create_latest()
        all_versions = [plan]

    ver_labels = [f"V{v['version']}  {v['label']}" for v in all_versions]
    sel_idx = st.selectbox(
        "작업 버전 선택",
        range(len(ver_labels)),
        format_func=lambda i: ver_labels[i],
        index=len(ver_labels) - 1,
        key="version_selector",
    )
    current_plan = all_versions[sel_idx]

    st.caption(f"**마지막 수정**: {current_plan.get('updated_at', '')[:16].replace('T', ' ')}")
    st.caption(f"**총 업데이트**: {len(current_plan.get('change_log', []))}회")

    st.divider()

    # ── API 사용량 절약 설정 ──
    st.subheader("⚡ 토큰 절약 설정")
    review_max_chars = st.slider(
        "심사 섹션당 글자 수 제한",
        min_value=0,
        max_value=2000,
        value=0,
        step=200,
        help="0 = 제한 없음 (전체). 높을수록 정확하지만 토큰 소모 많음. 절약 시 800 권장.",
        format="%d자",
    )
    if review_max_chars == 0:
        st.caption("현재: 전체 내용 전송 (정확도 최대)")
    else:
        st.caption(f"현재: 섹션당 최대 {review_max_chars}자 전송")

    st.divider()

    # ── 새 메이저 버전 분기 ──
    st.subheader("🌿 버전 분기")
    new_label = st.text_input("새 버전 라벨", placeholder="예: 초기창업 신청용 (V2.0)")
    if st.button("➕ 메이저 버전 분기", use_container_width=True):
        if new_label:
            fork = json.loads(json.dumps(current_plan))  # deep copy
            fork["version"] = bump_version(current_plan["version"], major=True)
            fork["label"] = new_label
            fork["created_at"] = datetime.now().isoformat()
            fork["updated_at"] = datetime.now().isoformat()
            fork["change_log"] = []
            save_version(fork)
            st.success(f"V{fork['version']} 분기 완료!")
            st.rerun()
        else:
            st.warning("라벨을 입력해주세요.")


# ═══════════════════════════════════════════════════
# 메인 헤더
# ═══════════════════════════════════════════════════
st.title("🎭 무대소환(Stage Summon) 사업계획서 AI")
st.caption("AI 기반 사업계획서 자동 업데이트 & 예비 심사 시스템")

c1, c2, c3, c4 = st.columns(4)
c1.metric("현재 버전", f"V{current_plan['version']}")
c2.metric("라벨", current_plan["label"][:16])
c3.metric("업데이트 횟수", len(current_plan.get("change_log", [])))
c4.metric("총 버전 수", len(all_versions))

st.divider()


# ═══════════════════════════════════════════════════
# 탭 구성
# ═══════════════════════════════════════════════════
tab_doc, tab_update, tab_review, tab_history = st.tabs([
    "📄 사업계획서",
    "✏️ AI 업데이트",
    "🔍 예비 심사",
    "📚 버전 히스토리",
])


# ─────────────────────────────────────────────────────
# TAB 1: 사업계획서 보기 / 수동 편집
# ─────────────────────────────────────────────────────
with tab_doc:
    st.subheader(current_plan["title"])

    view_mode = st.radio(
        "보기 방식",
        ["📜 전체 보기", "🔍 섹션별 보기"],
        horizontal=True,
        label_visibility="collapsed",
    )

    if view_mode == "📜 전체 보기":
        for key in SECTION_KEYS:
            with st.expander(SECTION_NAMES[key], expanded=True):
                st.markdown(current_plan["sections"].get(key, "내용 없음"))
    else:
        sel_sec = st.selectbox(
            "섹션 선택",
            SECTION_KEYS,
            format_func=lambda k: SECTION_NAMES[k],
        )
        content = current_plan["sections"].get(sel_sec, "")

        col_view, col_edit = st.columns([4, 1])
        with col_edit:
            edit_mode = st.toggle("✏️ 직접 편집", key=f"edit_toggle_{sel_sec}")

        if edit_mode:
            edited_content = st.text_area(
                "내용 편집",
                value=content,
                height=500,
                key=f"edit_area_{sel_sec}",
            )
            col_s, col_c = st.columns(2)
            with col_s:
                ver_label_manual = st.text_input("버전 라벨", placeholder="예: 수동 편집 반영")
                if st.button("💾 작성 완료 & 저장", type="primary", key="save_manual"):
                    new_plan = json.loads(json.dumps(current_plan))
                    new_plan["sections"][sel_sec] = edited_content
                    new_plan["version"] = bump_version(current_plan["version"])
                    new_plan["updated_at"] = datetime.now().isoformat()
                    new_plan["label"] = ver_label_manual or f"수동 편집 V{new_plan['version']}"
                    new_plan["change_log"] = current_plan.get("change_log", []) + [{
                        "timestamp": datetime.now().isoformat(),
                        "type": "manual_edit",
                        "version": new_plan["version"],
                        "updated_sections": [sel_sec],
                        "summary": f"{SECTION_NAMES[sel_sec]} 수동 편집",
                    }]
                    save_version(new_plan)
                    st.success(f"✅ V{new_plan['version']} 저장 완료!")
                    st.rerun()
            with col_c:
                if st.button("취소", key="cancel_manual"):
                    st.rerun()
        else:
            st.markdown(content)


# ─────────────────────────────────────────────────────
# TAB 2: AI 업데이트
# ─────────────────────────────────────────────────────
with tab_update:
    st.subheader("✏️ 새로운 정보 입력 → AI 자동 업데이트")

    if not api_key and not openai_key and not claude_key:
        st.warning("⚠️ 사이드바에서 API Key를 입력해주세요.")
        st.stop()

    st.info(
        "**사용 방법**: 아래에 새로운 정보를 자유롭게 입력하세요. AI가 해당 내용을 어느 섹션에 반영할지 판단하고 업데이트합니다.\\n\\n"
        "**예시**:\\n"
        "- `홍대 인디밴드 3팀이랑 구두 협의 완료함`\\n"
        "- `통계청에서 공연 시장 물가지수 119포인트 발표함`\\n"
        "- `MVP 베타 테스트에서 유저 만족도 4.2점 받음`\\n"
        "- `총 사업비 6천만 원, 자기부담금 1200만 원으로 수정`"
    )

    # 업데이트 모드 선택
    col_mode, col_scope = st.columns(2)
    with col_mode:
        update_mode = st.radio(
            "업데이트 방식",
            ["🔄 전체 업데이트", "⚡ 차분 업데이트 (토큰 절약)"],
            horizontal=True,
            help="차분: 변경 블록만 반환 → 토큰 80% 절감. 전체: 섹션 전체 재작성 → 정확도 높음.",
        )
    with col_scope:
        scope = st.radio(
            "업데이트 범위",
            ["🤖 AI가 자동 판단", "🎯 특정 섹션 지정"],
            horizontal=True,
        )

    target_secs = None
    if scope == "🎯 특정 섹션 지정" and update_mode == "🔄 전체 업데이트":
        target_secs = st.multiselect(
            "업데이트할 섹션",
            SECTION_KEYS,
            format_func=lambda k: SECTION_NAMES[k],
        )

    memo_input = st.text_area(
        "새로운 정보 / 메모 입력",
        placeholder="예: 클럽 FF와 MOU 체결 완료. 월 평균 공연 8회, 아티스트 15팀 활동 중.",
        height=160,
        key="memo_input",
    )

    col_btn1, col_btn2 = st.columns([3, 1])
    with col_btn1:
        run_btn = st.button(
            "🚀 AI 분석 & 업데이트 생성",
            type="primary",
            disabled=not memo_input.strip(),
            use_container_width=True,
        )

    if run_btn and memo_input.strip():
        is_diff = update_mode == "⚡ 차분 업데이트 (토큰 절약)"
        provider_label = {"OpenAI": "OpenAI", "Claude (Anthropic)": "Claude"}.get(ai_provider, "Gemini")
        mode_label = "차분" if is_diff else "전체"
        with st.spinner(f"{provider_label} AI 분석 중... ({mode_label} 업데이트)"):
            try:
                if is_diff:
                    # ── 차분 업데이트 경로 ──
                    if ai_provider == "OpenAI":
                        raw = ai_update_sections_diff_openai(openai_key, current_plan, memo_input)
                    elif ai_provider == "Claude (Anthropic)":
                        raw = ai_update_sections_diff_claude(claude_key, current_plan, memo_input)
                    else:
                        raw = ai_update_sections_diff(api_key, current_plan, memo_input)

                    # diff_updates → 각 섹션에 apply_diff_update 적용해 updates 형태로 변환
                    diff_updates = raw.get("diff_updates", {})
                    applied_updates = {}
                    for sec_key, patches in diff_updates.items():
                        original = current_plan["sections"].get(sec_key, "")
                        applied_updates[sec_key] = apply_diff_update(original, patches)

                    result = {
                        "target_sections": list(diff_updates.keys()),
                        "reason": raw.get("reason", ""),
                        "updates": applied_updates,
                        "summary": raw.get("summary", ""),
                        "reviewer_comment": raw.get("reviewer_comment", ""),
                        "warnings": raw.get("warnings", []),
                    }
                else:
                    # ── 전체 업데이트 경로 ──
                    if ai_provider == "OpenAI":
                        result = ai_update_sections_openai(openai_key, current_plan, memo_input, target_secs)
                    elif ai_provider == "Claude (Anthropic)":
                        result = ai_update_sections_claude(claude_key, current_plan, memo_input, target_secs)
                    else:
                        result = ai_update_sections(api_key, current_plan, memo_input, target_secs)
            except json.JSONDecodeError as e:
                st.error(f"AI 응답 파싱 실패: {e}")
                st.stop()
            except Exception as e:
                st.error(f"오류 발생: {e}")
                st.stop()

        st.success("✅ AI 분석 완료!")

        # ── 변경 요약 ──
        st.subheader("📋 변경 요약")
        st.info(result.get("summary", ""))
        st.caption(f"**영향 이유**: {result.get('reason', '')}")

        updated_sec_keys = result.get("target_sections", list(result.get("updates", {}).keys()))
        if updated_sec_keys:
            st.caption("**업데이트 섹션**: " + " / ".join([SECTION_NAMES.get(s, s) for s in updated_sec_keys]))

        # ── 검증 경고 ──
        warnings = result.get("warnings", [])
        if warnings:
            st.subheader("⚠️ 검증 경고")
            for w in warnings:
                st.warning(w)

        # ── 심사위원 코멘트 ──
        reviewer_comment = result.get("reviewer_comment", "")
        if reviewer_comment:
            st.subheader("💬 심사위원 코멘트")
            st.info(reviewer_comment)

        # ── 섹션 변경 미리보기 ──
        updates = result.get("updates", {})
        if updates:
            st.subheader("🔍 섹션 변경 미리보기")
            for sec_key, new_content in updates.items():
                sec_name = SECTION_NAMES.get(sec_key, sec_key)
                with st.expander(f"📝 {sec_name}", expanded=True):
                    col_b, col_a = st.columns(2)
                    with col_b:
                        st.caption("**이전 내용** (앞 600자)")
                        prev = current_plan["sections"].get(sec_key, "")
                        st.markdown(prev[:600] + ("..." if len(prev) > 600 else ""))
                    with col_a:
                        st.caption("**업데이트 내용** (앞 600자)")
                        st.markdown(new_content[:600] + ("..." if len(new_content) > 600 else ""))

            st.divider()

            # ── 확정 버튼 ──
            ver_label_ai = st.text_input(
                "이 버전의 라벨 (선택)",
                placeholder="예: 파트너십 현황 업데이트",
                key="ver_label_ai",
            )

            col_confirm, col_cancel = st.columns(2)
            with col_confirm:
                if st.button("✅ 작성 완료 (새 버전 저장)", type="primary", key="confirm_update"):
                    new_plan = json.loads(json.dumps(current_plan))
                    for sec_key, new_content in updates.items():
                        new_plan["sections"][sec_key] = new_content
                    new_ver = bump_version(current_plan["version"])
                    new_plan["version"] = new_ver
                    new_plan["updated_at"] = datetime.now().isoformat()
                    new_plan["label"] = ver_label_ai or f"AI 업데이트 V{new_ver}"
                    new_plan["change_log"] = current_plan.get("change_log", []) + [{
                        "timestamp": datetime.now().isoformat(),
                        "type": "ai_update",
                        "version": new_ver,
                        "memo": memo_input,
                        "updated_sections": list(updates.keys()),
                        "summary": result.get("summary", ""),
                        "warnings": warnings,
                    }]
                    save_version(new_plan)
                    st.success(f"🎉 V{new_ver} 저장 완료!")
                    st.rerun()
            with col_cancel:
                if st.button("❌ 적용 취소", key="cancel_update"):
                    st.rerun()
        else:
            st.warning("AI가 업데이트할 섹션을 찾지 못했습니다. 메모 내용을 더 구체적으로 입력해보세요.")


# ─────────────────────────────────────────────────────
# TAB 3: 예비 심사
# ─────────────────────────────────────────────────────
with tab_review:
    st.subheader("🔍 AI 예비 심사")
    st.info(
        "2026 예술분야 창업지원사업 심사 기준으로 현재 사업계획서를 AI가 예비 심사합니다.\\n"
        "심사에는 약 30~60초가 소요됩니다 (Gemini 1.5 Pro 모델 사용)."
    )

    if not api_key and not openai_key and not claude_key:
        st.warning("⚠️ 사이드바에서 API Key를 입력해주세요.")
        st.stop()

    if st.button("🔍 예비 심사 시작", type="primary", key="start_review"):
        with st.spinner("심사위원 AI가 검토 중입니다..."):
            try:
                if ai_provider == "OpenAI":
                    review = ai_preliminary_review_openai(openai_key, current_plan, review_max_chars)
                elif ai_provider == "Claude (Anthropic)":
                    review = ai_preliminary_review_claude(claude_key, current_plan, review_max_chars)
                else:
                    review = ai_preliminary_review(api_key, current_plan)
            except json.JSONDecodeError as e:
                st.error(f"AI 응답 파싱 실패: {e}")
                st.stop()
            except Exception as e:
                st.error(f"심사 중 오류: {e}")
                st.stop()

        # ── 종합 점수 ──
        score = review.get("overall_score", 0)
        grade = review.get("grade", "-")
        likelihood = review.get("approval_likelihood", "-")
        likelihood_color = {"높음": "green", "보통": "orange", "낮음": "red"}.get(likelihood, "gray")

        col_s1, col_s2, col_s3 = st.columns(3)
        col_s1.metric("종합 점수", f"{score} / 100", delta=grade)
        col_s2.metric("합격 가능성", likelihood)
        col_s3.metric("평가 버전", f"V{current_plan['version']}")

        st.info(review.get("overall_comment", ""))

        # ── 필수 조건 검증 ──
        st.subheader("✅ 필수 조건 검증 (4개 항목)")
        validation_items = {
            "recurring_bm": "반복 가능한 수익 구조 (BM)",
            "art_ecosystem": "예술 생태계 기여도",
            "fund_ratio": "자금 운용 현실성 (자기부담금 20%)",
            "scaleup_roadmap": "연속 성장 로드맵 (3년 KPI)",
        }
        validation = review.get("validation_check", {})

        vcols = st.columns(2)
        for idx, (key, label) in enumerate(validation_items.items()):
            check = validation.get(key, {})
            with vcols[idx % 2]:
                if check.get("pass"):
                    st.success(f"✅ **{label}**")
                else:
                    st.error(f"❌ **{label}**")
                if check.get("comment"):
                    st.caption(check["comment"])

        # ── 섹션별 점수 ──
        st.subheader("📊 섹션별 평가")
        section_reviews = review.get("section_reviews", {})

        for key in SECTION_KEYS:
            sr = section_reviews.get(key, {})
            score_s = sr.get("score", 0)
            bar_color = "🟢" if score_s >= 75 else ("🟡" if score_s >= 55 else "🔴")
            with st.expander(f"{bar_color} {SECTION_NAMES[key]} — {score_s}점", expanded=False):
                col_str, col_wk = st.columns(2)
                with col_str:
                    st.caption("💪 강점")
                    for s in sr.get("strengths", []):
                        st.markdown(f"- {s}")
                with col_wk:
                    st.caption("⚠️ 약점")
                    for w in sr.get("weaknesses", []):
                        st.markdown(f"- {w}")
                st.caption("💡 개선 제안")
                st.info(sr.get("suggestions", ""))

        # ── 우선 보완 사항 ──
        st.subheader("🎯 우선 보완 사항 (Top 3)")
        for i, item in enumerate(review.get("priority_improvements", [])[:3], 1):
            st.markdown(f"**{i}.** {item}")

        # ── 경쟁 우위 ──
        st.subheader("⚔️ 경쟁 우위 분석")
        st.success(review.get("competitive_edge", ""))

        # ── 합격 이유 ──
        st.caption(f"합격 가능성 판단 근거: {review.get('approval_reason', '')}")


# ─────────────────────────────────────────────────────
# TAB 4: 버전 히스토리
# ─────────────────────────────────────────────────────
with tab_history:
    st.subheader("📚 버전 히스토리")

    all_versions_hist = load_versions()
    if not all_versions_hist:
        st.info("저장된 버전이 없습니다.")
    else:
        # ── 타임라인 ──
        for v in reversed(all_versions_hist):
            with st.container(border=True):
                h1, h2 = st.columns([1, 5])
                with h1:
                    st.markdown(f"### V{v['version']}")
                    st.caption(v.get("updated_at", "")[:10])
                with h2:
                    st.markdown(f"**{v['label']}**")
                    log = v.get("change_log", [])
                    if log:
                        latest_log = log[-1]
                        st.caption(f"마지막 변경: {latest_log.get('summary', '')}")
                        updated_secs = latest_log.get("updated_sections", [])
                        if updated_secs:
                            st.caption(
                                "수정 섹션: " + " / ".join([SECTION_NAMES.get(s, s) for s in updated_secs])
                            )
                        if latest_log.get("memo"):
                            with st.expander("입력 메모 보기"):
                                st.text(latest_log["memo"])
                        if latest_log.get("warnings"):
                            for w in latest_log["warnings"]:
                                st.warning(f"⚠️ {w}")
                    else:
                        st.caption("초기 생성 버전")

        # ── 버전 비교 ──
        if len(all_versions_hist) >= 2:
            st.divider()
            st.subheader("🔄 버전 비교")

            col_v1, col_v2 = st.columns(2)
            with col_v1:
                v1_idx = st.selectbox(
                    "기준 버전",
                    range(len(all_versions_hist)),
                    format_func=lambda i: f"V{all_versions_hist[i]['version']} — {all_versions_hist[i]['label']}",
                    key="compare_v1",
                )
            with col_v2:
                v2_default = min(v1_idx + 1, len(all_versions_hist) - 1)
                v2_idx = st.selectbox(
                    "비교 버전",
                    range(len(all_versions_hist)),
                    format_func=lambda i: f"V{all_versions_hist[i]['version']} — {all_versions_hist[i]['label']}",
                    index=v2_default,
                    key="compare_v2",
                )

            compare_sec = st.selectbox(
                "비교할 섹션",
                SECTION_KEYS,
                format_func=lambda k: SECTION_NAMES[k],
                key="compare_sec",
            )

            if st.button("📊 비교 보기", key="do_compare"):
                v1_data = all_versions_hist[v1_idx]
                v2_data = all_versions_hist[v2_idx]
                col_l, col_r = st.columns(2)
                with col_l:
                    st.caption(f"**V{v1_data['version']}** — {v1_data['label']}")
                    st.markdown(v1_data["sections"].get(compare_sec, "내용 없음"))
                with col_r:
                    st.caption(f"**V{v2_data['version']}** — {v2_data['label']}")
                    st.markdown(v2_data["sections"].get(compare_sec, "내용 없음"))
