"""
무대소환(Stage Summon) 사업계획서 AI 관리 시스템
- Google Gemini API 기반 자동 업데이트 & 예비 심사
"""

import streamlit as st
import json
import os
import re
from datetime import datetime
from pathlib import Path
import google.generativeai as genai

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
# 상수 / 데이터 구조
# ═══════════════════════════════════════════════════
VERSIONS_DIR = Path("data/versions")
VERSIONS_DIR.mkdir(parents=True, exist_ok=True)

SECTION_KEYS = ["section1", "section2", "section3", "section4", "section5", "section6"]

SECTION_NAMES = {
    "section1": "1. 사업의 필요성",
    "section2": "2. 독창성 및 차별성",
    "section3": "3. 수익 모델 (BM)",
    "section4": "4. 리스크 관리",
    "section5": "5. 성장 로드맵",
    "section6": "6. 추진 일정",
}

SYSTEM_PROMPT = """[Role & Objective]
당신은 정부지원사업 심사위원이자 전문 스타트업 컨설턴트입니다.
사용자가 '무대소환(Stage Summon)' 사업계획서와 관련된 새로운 정보(데이터, 성과, 시장 동향 등)를 입력하면,
기존 6가지 섹션(사업의 필요성, 독창성, 수익모델, 리스크 관리, 성장 로드맵, 추진 일정) 중
가장 적절한 섹션을 찾아 내용을 업데이트하고 고도화하십시오.

[서비스 소개]
무대소환(Stage Summon)은 인디 예술인과 공연 기획자를 연결하는 역경매 기반 공연 매칭 플랫폼입니다.

[Validation Rules: 2026 예술분야 창업지원사업 필수 조건]
문서를 업데이트할 때 다음의 결격 사유나 필수 요건이 훼손되지 않도록 검증하고, 위반 시 반드시 경고를 출력하십시오.

1. 일회성 사업 배제: 단순한 1회성 공연·행사 기획이 아닌, '플랫폼 수수료·구독·데이터 판매' 등
   반복 가능하고 지속적인 수익 구조(BM)임을 강조해야 합니다.

2. 예술 생태계 기여도: 기술(역경매, AI) 중심의 설명에 매몰되지 않도록,
   이 사업이 '인디 예술인의 경제적 자생력'과 '예술 소비 시장 확대'에 어떻게 기여하는지 명시해야 합니다.

3. 자금 운용의 현실성: 총사업비의 20%를 기업 자비(자기부담금)로 편성해야 합니다.
   재무 계획 입력 시 이 비율이 지켜졌는지 확인하십시오.

4. 연속 성장(Scale-up) 로드맵: 해당 지원사업은 성과 달성 시 최대 3회(예비→초기→도약) 연속 지원 가능합니다.
   로드맵 업데이트 시 향후 3년의 스케일업 KPI가 반드시 포함되도록 유도하십시오."""

# ═══════════════════════════════════════════════════
# 초기 사업계획서 내용 (프리셋)
# ═══════════════════════════════════════════════════
INITIAL_SECTIONS = {
    "section1": """\
## 1. 사업의 필요성

### 시장 현황 및 문제점
국내 인디 음악·공연 시장은 연간 약 1조 원 규모로 성장하였으나, 인디 예술인의 97%는
공연 정보 비대칭 문제로 인해 실질적인 수익 창출에 어려움을 겪고 있습니다.

| 이해관계자 | 핵심 문제 |
|-----------|---------|
| 공연 기획자 | 적합한 아티스트 검색에 평균 2~3주 소요, 섭외 실패율 40% 이상 |
| 인디 아티스트 | 공연 정보 접근 채널 부재 → 월평균 공연 수입 30만 원 미만 (전체의 78%) |
| 공연 소비자 | 개성 있는 인디 공연 검색 경로 없음 → 대형 기획사 공연으로 소비 집중 |

### 정책적 배경
2026년 문화체육관광부는 '예술인 경제적 자생력 강화' 정책 기조 하에,
디지털 플랫폼을 통한 예술 유통 구조 혁신 과제를 핵심 지원 사업으로 선정하였습니다.

### 무대소환의 솔루션
역경매 방식의 공연 매칭 플랫폼 '무대소환'은 위 구조적 문제를 해결하는
**지속가능한 디지털 유통 인프라**를 제공합니다.
플랫폼을 통해 인디 예술인의 경제적 자생력을 높이고, 예술 소비 시장을 확대합니다.""",

    "section2": """\
## 2. 독창성 및 차별성

### 핵심 기술: 역경매(Reverse Auction) 매칭 시스템
기존 플랫폼이 아티스트가 직접 홍보해야 하는 '아웃바운드' 방식인 반면,
무대소환은 공연 기획자가 조건을 제시하면 아티스트가 지원하는 **'인바운드 역경매'** 구조입니다.

| 구분 | 기존 플랫폼 | 무대소환 |
|------|------------|---------|
| 매칭 방식 | 아티스트 직접 홍보 | 역경매 기반 자동 매칭 |
| 정보 투명성 | 비공개 협상 | 공개 조건 경쟁 |
| AI 활용 | 없음 | 장르·분위기·예산 기반 AI 추천 |
| 수익 구조 | 단순 광고 | 플랫폼 수수료 + 구독 + 데이터 판매 |

### 예술 생태계 기여
- **인디 예술인 자생력**: 플랫폼 매칭을 통해 안정적인 공연 수입 경로 확보
- **예술 소비 시장 확대**: 취향 기반 AI 추천으로 새로운 인디 팬덤 형성 지원

### 특허 및 IP 전략
- 역경매 매칭 알고리즘 특허 출원 예정
- 아티스트 포트폴리오 AI 분석 기술 자체 개발""",

    "section3": """\
## 3. 수익 모델 (BM)

### 지속 가능한 멀티 레이어 수익 구조
무대소환의 수익 모델은 단순 중개 수수료를 넘어 **3단계 레이어 BM**으로 설계되었습니다.

**Layer 1. 거래 수수료 (핵심 BM)**
- 공연 성사 시 총 계약금의 10~15% 수수료 부과
- 예상 수수료 단가: 건당 15만~50만 원
- 월 목표 거래 건수: 1년차 50건 → 3년차 500건

**Layer 2. 구독 서비스 (Pro 플랜)**
- 기획자 Pro: 월 9,900원 (우선 매칭, 분석 리포트 제공)
- 아티스트 Pro: 월 4,900원 (노출 우선순위, 포트폴리오 고도화)

**Layer 3. 데이터 B2B 판매**
- 지역별·장르별 공연 수요 데이터를 공연장·지자체에 판매
- 예상 단가: 연간 리포트 500만 원/건

### 자금 운용 계획 (2026년 기초단계)
| 항목 | 금액 | 비율 |
|------|------|------|
| 정부 지원금 | 40,000,000원 | 80% |
| **자기부담금** | **10,000,000원** | **20% ✅** |
| 총 사업비 | 50,000,000원 | 100% |

> ✅ 자기부담금 20% 규정 준수 확인됨""",

    "section4": """\
## 4. 리스크 관리

### 주요 리스크 및 대응 전략

**① 초기 공급 부족 리스크 (콜드스타트 문제)**
- 리스크: 플랫폼 초기 아티스트/기획자 수 부족으로 매칭 실패율 증가
- 대응: 사전 파트너십 구두 협의를 통해 런칭 전 아티스트 50팀, 기획자 20개사 확보
- 목표: 베타 서비스 3개월 내 거래 성사 30건 달성

**② 수수료 저항 리스크**
- 리스크: 기존 아날로그 거래 방식 선호로 인한 플랫폼 이탈
- 대응: 초기 6개월 수수료 50% 감면 프로모션, 부가 서비스 번들 제공

**③ 경쟁 플랫폼 진입 리스크**
- 리스크: 대형 플랫폼의 유사 서비스 출시
- 대응: 역경매 특허 보호 + 아티스트 포트폴리오 데이터 선점 전략

**④ 규제 리스크**
- 리스크: 공연 중개업 관련 법적 규제 변화
- 대응: 문화체육관광부 공연예술중개업 등록 선제적 완료""",

    "section5": """\
## 5. 성장 로드맵

### 3개년 스케일업 전략 (예비→초기→도약)

**Phase 1. 예비창업 단계 (2026년)**
- 목표: MVP 개발 및 베타 서비스 출시
- KPI:
  - 등록 아티스트 100팀 확보
  - 월간 공연 매칭 30건 달성
  - 베타 유저 만족도 4.0/5.0 이상
  - 누적 거래액 3,000만 원
- 핵심 활동: 홍대·이태원 인디씬 파트너십 구축, 플랫폼 MVP 개발

**Phase 2. 초기창업 단계 (2027년)**
- 목표: 서비스 고도화 및 수도권 확장
- KPI:
  - 등록 아티스트 500팀 / 기획자 100개사
  - 월간 공연 매칭 150건
  - 월 매출 3,000만 원 달성
  - 시리즈 A 투자 유치 준비
- 핵심 활동: AI 추천 알고리즘 고도화, Pro 구독 서비스 출시

**Phase 3. 도약 단계 (2028년)**
- 목표: 전국 확장 및 해외 시장 진출 준비
- KPI:
  - 전국 5개 도시 서비스 확장
  - 누적 공연 매칭 2,000건
  - 연 매출 15억 원 달성
  - 동남아시아 1개국 파일럿 런칭
- 핵심 활동: 글로벌 인디 씬 네트워크 구축, 데이터 B2B 사업 본격화""",

    "section6": """\
## 6. 추진 일정

### 2026년 월별 세부 계획

| 기간 | 주요 마일스톤 | 담당 |
|------|-------------|------|
| 2026.01~02 | 팀 구성 완료, 기술 스택 확정 | 전체 |
| 2026.03~04 | MVP 핵심 기능 개발 (매칭 엔진, 프로필) | 개발팀 |
| 2026.05 | 베타 파트너 아티스트 20팀 온보딩 | 사업팀 |
| 2026.06 | 클로즈드 베타 테스트 (50명) | 전체 |
| 2026.07~08 | 피드백 반영, UX 개선 | 개발팀 |
| 2026.09 | 공개 베타 서비스 출시 | 전체 |
| 2026.10~11 | 수수료 과금 시스템 활성화 | 사업팀 |
| 2026.12 | 1년차 성과 평가, 초기창업 신청 준비 | 전체 |

### 파트너십 현황
- 협의 진행 중: 홍대 인디 공연장 5개소
- MOU 추진 예정: 인디 레이블 3개사

### 정부 지원사업 신청 일정
- 2026년 5월: 기초단계 신청 (현재 목표)
- 2027년 초: 초기창업 단계 신청 예정""",
}


# ═══════════════════════════════════════════════════
# 유틸리티 함수
# ═══════════════════════════════════════════════════

def load_versions() -> list[dict]:
    """저장된 모든 버전을 버전 번호 순으로 로드"""
    versions = []
    for f in sorted(VERSIONS_DIR.glob("v*.json")):
        try:
            with open(f, encoding="utf-8") as fp:
                versions.append(json.load(fp))
        except Exception:
            pass
    return versions


def save_version(plan: dict):
    """버전 JSON 저장"""
    ver = plan["version"].replace(".", "_")
    path = VERSIONS_DIR / f"v{ver}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)


def get_or_create_latest() -> dict:
    """최신 버전 반환; 없으면 초기 버전 생성"""
    versions = load_versions()
    if versions:
        return versions[-1]
    plan = _make_initial_plan()
    save_version(plan)
    return plan


def _make_initial_plan() -> dict:
    now = datetime.now().isoformat()
    return {
        "version": "1.0",
        "label": "기초단계 신청용 (초안)",
        "title": "무대소환(Stage Summon) 사업계획서",
        "created_at": now,
        "updated_at": now,
        "change_log": [],
        "sections": {k: v for k, v in INITIAL_SECTIONS.items()},
    }


def bump_version(ver: str, major: bool = False) -> str:
    parts = ver.split(".")
    mj, mn = int(parts[0]), int(parts[1])
    if major:
        return f"{mj + 1}.0"
    return f"{mj}.{mn + 1}"


def _strip_json(text: str) -> str:
    """AI 응답에서 순수 JSON만 추출"""
    text = text.strip()
    # ```json ... ``` 블록 제거
    m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if m:
        return m.group(1).strip()
    return text


# ═══════════════════════════════════════════════════
# Gemini API 함수
# ═══════════════════════════════════════════════════

def get_model(api_key: str, pro: bool = False):
    genai.configure(api_key=api_key)
    model_name = "gemini-1.5-pro" if pro else "gemini-1.5-flash"
    return genai.GenerativeModel(model_name)


def ai_update_sections(api_key: str, current_plan: dict, memo: str, target_sections: list | None = None) -> dict:
    """
    메모를 분석해 관련 섹션을 업데이트.
    Returns dict with keys: target_sections, reason, updates, summary, reviewer_comment, warnings
    """
    model = get_model(api_key)

    sections_summary = "\n\n".join([
        f"### {SECTION_NAMES[k]}\n{current_plan['sections'].get(k, '')[:400]}..."
        for k in SECTION_KEYS
    ])

    scope_note = ""
    if target_sections:
        names = [SECTION_NAMES[s] for s in target_sections]
        scope_note = f"\n\n[중요] 반드시 아래 섹션만 업데이트하세요: {', '.join(names)}"

    prompt = f"""{SYSTEM_PROMPT}

---
현재 사업계획서 각 섹션 요약:
{sections_summary}
---
사용자 입력 메모:{scope_note}
{memo}
---

위 메모를 분석하여 다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록, 설명 없이 순수 JSON만):

{{
  "target_sections": ["section1"],
  "reason": "이 메모가 해당 섹션에 영향을 주는 이유 (1~2문장)",
  "updates": {{
    "section1": "업데이트된 전체 섹션 내용 (마크다운 형식 유지)"
  }},
  "summary": "3줄 이내 변경 요약",
  "reviewer_comment": "심사위원 관점의 추가 보완 제안",
  "warnings": ["검증 위반 사항 (없으면 빈 배열)"]
}}"""

    resp = model.generate_content(prompt)
    return json.loads(_strip_json(resp.text))


def ai_preliminary_review(api_key: str, current_plan: dict) -> dict:
    """
    전체 사업계획서를 심사 기준으로 예비 심사.
    Returns dict with scoring info.
    """
    model = get_model(api_key, pro=True)  # 심사는 Pro 모델 사용

    full_content = "\n\n---\n\n".join([
        f"# {SECTION_NAMES[k]}\n\n{current_plan['sections'].get(k, '')}"
        for k in SECTION_KEYS
    ])

    prompt = f"""{SYSTEM_PROMPT}

---
아래 사업계획서를 2026 예술분야 창업지원사업 심사 기준으로 예비 심사하세요.

{full_content}
---

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "section_reviews": {{
    "section1": {{
      "score": 80,
      "strengths": ["강점 1", "강점 2"],
      "weaknesses": ["약점 1"],
      "suggestions": "개선 제안"
    }},
    "section2": {{"score": 0, "strengths": [], "weaknesses": [], "suggestions": ""}},
    "section3": {{"score": 0, "strengths": [], "weaknesses": [], "suggestions": ""}},
    "section4": {{"score": 0, "strengths": [], "weaknesses": [], "suggestions": ""}},
    "section5": {{"score": 0, "strengths": [], "weaknesses": [], "suggestions": ""}},
    "section6": {{"score": 0, "strengths": [], "weaknesses": [], "suggestions": ""}}
  }},
  "validation_check": {{
    "recurring_bm": {{"pass": true, "comment": ""}},
    "art_ecosystem": {{"pass": true, "comment": ""}},
    "fund_ratio": {{"pass": true, "comment": ""}},
    "scaleup_roadmap": {{"pass": true, "comment": ""}}
  }},
  "priority_improvements": ["우선 보완 1", "우선 보완 2", "우선 보완 3"],
  "competitive_edge": "경쟁 우위 분석 (2~3문장)",
  "approval_likelihood": "합격 가능성 (높음/보통/낮음)",
  "approval_reason": "그 이유"
}}"""

    resp = model.generate_content(prompt)
    return json.loads(_strip_json(resp.text))


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
    api_key = st.text_input(
        "Google Gemini API Key",
        type="password",
        value=os.environ.get("GEMINI_API_KEY", ""),
        help="https://aistudio.google.com 에서 무료 발급 가능",
        placeholder="AIza...",
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

    if not api_key:
        st.warning("⚠️ 사이드바에서 Gemini API Key를 입력해주세요.")
        st.stop()

    st.info(
        "**사용 방법**: 아래에 새로운 정보를 자유롭게 입력하세요. AI가 해당 내용을 어느 섹션에 반영할지 판단하고 업데이트합니다.\n\n"
        "**예시**:\n"
        "- `홍대 인디밴드 3팀이랑 구두 협의 완료함`\n"
        "- `통계청에서 공연 시장 물가지수 119포인트 발표함`\n"
        "- `MVP 베타 테스트에서 유저 만족도 4.2점 받음`\n"
        "- `총 사업비 6천만 원, 자기부담금 1200만 원으로 수정`"
    )

    # 업데이트 범위 선택
    scope = st.radio(
        "업데이트 범위",
        ["🤖 AI가 자동 판단", "🎯 특정 섹션 지정"],
        horizontal=True,
    )

    target_secs = None
    if scope == "🎯 특정 섹션 지정":
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
        with st.spinner("Gemini AI가 분석 중입니다... (10~20초)"):
            try:
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
        "2026 예술분야 창업지원사업 심사 기준으로 현재 사업계획서를 AI가 예비 심사합니다.\n"
        "심사에는 약 30~60초가 소요됩니다 (Gemini 1.5 Pro 모델 사용)."
    )

    if not api_key:
        st.warning("⚠️ 사이드바에서 Gemini API Key를 입력해주세요.")
        st.stop()

    if st.button("🔍 예비 심사 시작", type="primary", key="start_review"):
        with st.spinner("심사위원 AI가 검토 중입니다..."):
            try:
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
