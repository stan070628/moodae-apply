import json
import time
from functools import wraps
from google import genai
from openai import OpenAI
import anthropic

from core.prompts.apply_prompts import SYSTEM_PROMPT, SECTION_KEYS, SECTION_NAMES
from utils.text_parser import parse_json_from_text
from core.ai_resilient_client import with_retry, AIAPIClient, get_client

# ═══════════════════════════════════════════════════
# Utils - Use resilient retry from ai_resilient_client
# ═══════════════════════════════════════════════════
def retry_with_exponential_backoff(max_retries: int = 5, base_delay: float = 1.0, backoff_factor: float = 2.0):
    """Wrapper using the new resilient retry logic."""
    return with_retry(max_retries=max_retries, base_delay=base_delay, max_delay=32.0)

# ═══════════════════════════════════════════════════
# Gemini API
# ═══════════════════════════════════════════════════
def get_model(api_key: str, pro: bool = False):
    client = genai.Client(api_key=api_key)
    model_name = "gemini-2.5-pro" if pro else "gemini-2.5-flash"
    return client, model_name

@retry_with_exponential_backoff()
def _gemini_generate(client_and_model, prompt: str):
    client, model_name = client_and_model
    return client.models.generate_content(
        model=model_name,
        contents=prompt
    )

def ai_update_sections(api_key: str, current_plan: dict, memo: str, target_sections: list | None = None) -> dict:
    client_model = get_model(api_key)
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
    try:
        resp = _gemini_generate(client_model, prompt)
        return json.loads(parse_json_from_text(resp.text))
    except Exception as e:
        if "429 You exceeded your current quota" in str(e) or "ResourceExhausted" in str(e):
            return {
                "target_sections": [],
                "reason": "데이터 수집 지연",
                "updates": {},
                "summary": "실전 데이터 정밀 분석 중 지연이 발생했습니다. 다시 시도해 주세요.",
                "reviewer_comment": "정부 합격 사례 및 실전 VC 데이터 대조 과정에서 서버 과부하가 발생했습니다. 잠시 후 재시도 바랍니다.",
                "warnings": ["분석 지연 에러"]
            }
        raise e

def ai_preliminary_review(api_key: str, current_plan: dict) -> dict:
    client_model = get_model(api_key, pro=True)
    full_content = "\n\n---\n\n".join([
        f"# {SECTION_NAMES[k]}\n\n{current_plan['sections'].get(k, '')}"
        for k in SECTION_KEYS
    ])
    prompt = f"""{SYSTEM_PROMPT}

---
아래 사업계획서를 2026 예술분야 창업지원사업 심사 기준으로 예비 심사하세요.

{full_content}
---

다음 4대 평가 지표 알고리즘으로 채점하세요:
- 지표1 전문성 및 역량(30점): 창업팀 이력-아이템 연관성 키워드 분석 + 예술적 역량 기술의 구체성 및 전문 용어 적절성 평가
- 지표2 제안 사업의 타당성(30점): 수익 모델의 논리적 완결성 + 정부 예산 지침 준수율 + 단계별 목표의 실현 가능성 대조
- 지표3 성장 가능성 및 파급력(20점): 시장 데이터 기반 신뢰도 분석 + VC 투자 트렌드 및 IR 레퍼런스 대비 USP 독창성 기반
- 지표4 예술분야 기여도(20점): 예술 생태계 활성화 구조 분석 + 공공 지원 사업 목적 키워드 일치도 및 사회적 가치 범위 측정

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "indicators": {{
    "ind1_expertise": {{
      "score": 22,
      "max_score": 30,
      "label": "전문성 및 역량",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1", "강점 2"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind2_feasibility": {{
      "score": 22,
      "max_score": 30,
      "label": "제안 사업의 타당성",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind3_growth": {{
      "score": 14,
      "max_score": 20,
      "label": "성장 가능성 및 파급력",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind4_art": {{
      "score": 16,
      "max_score": 20,
      "label": "예술분야 기여도",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }}
  }},
  "validation_check": {{
    "recurring_bm": {{"pass": true, "comment": ""}},
    "art_ecosystem": {{"pass": true, "comment": ""}},
    "fund_ratio": {{"pass": true, "comment": ""}},
    "scaleup_roadmap": {{"pass": true, "comment": ""}}
  }},
  "priority_improvements": ["우선 보완 1", "우선 보완 2", "우선 보완 3"],
  "ai_strategy_report": "정부/VC 레퍼런스 대조 결과를 바탕으로 한 종합 전략 리포트 (3~5문장)",
  "competitive_edge": "경쟁 우위 분석 (2~3문장)",
  "approval_likelihood": "높음/보통/낮음",
  "approval_reason": "그 이유"
}}"""
    try:
        resp = _gemini_generate(client_model, prompt)
        return json.loads(parse_json_from_text(resp.text))
    except Exception as e:
        if "429 You exceeded your current quota" in str(e) or "ResourceExhausted" in str(e):
            return {
                "_error_type": "RATE_LIMIT",
                "overall_score": 0,
                "grade": "N/A",
                "overall_comment": "실전 데이터 정밀 분석 중 지연이 발생했습니다. 다시 시도해 주세요.",
                "indicators": {
                    k: {"score": 0, "max_score": m, "label": l, "algorithm_basis": "분석 지연", "strengths": [], "weaknesses": [], "improvement": "잠시 후 재시도"}
                    for k, m, l in [("ind1_expertise", 30, "전문성 및 역량"), ("ind2_feasibility", 30, "제안 사업의 타당성"), ("ind3_growth", 20, "성장 가능성 및 파급력"), ("ind4_art", 20, "예술분야 기여도")]
                },
                "validation_check": {
                    "recurring_bm": {"pass": False, "comment": "분석 지연"},
                    "art_ecosystem": {"pass": False, "comment": "분석 지연"},
                    "fund_ratio": {"pass": False, "comment": "분석 지연"},
                    "scaleup_roadmap": {"pass": False, "comment": "분석 지연"}
                },
                "priority_improvements": ["잠시 후 재시도"],
                "ai_strategy_report": "N/A",
                "competitive_edge": "N/A",
                "approval_likelihood": "분석 지연",
                "approval_reason": "API 할당량 초과 — 잠시 후 재시도 바랍니다."
            }
        raise e

def ai_update_sections_diff(api_key: str, current_plan: dict, memo: str) -> dict:
    client_model = get_model(api_key)
    sections_structure = "\n".join([f"- {SECTION_NAMES[k]}" for k in SECTION_KEYS])
    prompt = f"""{SYSTEM_PROMPT}

현재 사업계획서 구조:
{sections_structure}

사용자 메모: "{memo}"

위 메모를 반영하여 '변경된 부분'만 아래 JSON 형식으로 추출하세요.
전체 내용을 다시 쓰지 말고, 수정이 필요한 소제목(target_subhead)과 그 하위 내용만 작성하세요.

{{
  "reason": "업데이트 이유",
  "diff_updates": {{
    "section1": [
      {{
        "target_subhead": "### 시장 현황 및 문제점",
        "new_content": "업데이트된 상세 내용..."
      }}
    ]
  }},
  "summary": "변경 사항 요약",
  "reviewer_comment": "심사위원 관점 제안",
  "warnings": []
}}"""
    try:
        resp = _gemini_generate(client_model, prompt)
        return json.loads(parse_json_from_text(resp.text))
    except Exception as e:
        if "429 You exceeded your current quota" in str(e) or "ResourceExhausted" in str(e):
            return {
                "reason": "데이터 수집 지연",
                "diff_updates": {},
                "summary": "실전 데이터 정밀 분석 중 지연이 발생했습니다. 다시 시도해 주세요.",
                "reviewer_comment": "정부/VC 실전 사례 데이터 대조 과정에서 서버 지연이 발생했습니다. 잠시 후 재시도 바랍니다.",
                "warnings": ["분석 지연 에러"]
            }
        raise e

# ═══════════════════════════════════════════════════
# OpenAI API
# ═══════════════════════════════════════════════════
def _openai_chat(api_key: str, user_prompt: str, model: str = "gpt-4o-mini") -> str:
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )
    return resp.choices[0].message.content

def ai_update_sections_openai(api_key: str, current_plan: dict, memo: str, target_sections: list | None = None) -> dict:
    sections_summary = "\n\n".join([
        f"### {SECTION_NAMES[k]}\n{current_plan['sections'].get(k, '')[:200]}..."
        for k in SECTION_KEYS
    ])
    scope_note = ""
    if target_sections:
        names = [SECTION_NAMES[s] for s in target_sections]
        scope_note = f"\n\n[중요] 반드시 아래 섹션만 업데이트하세요: {', '.join(names)}"

    prompt = f"""---
현재 사업계획서 각 섹션 요약:
{sections_summary}
---
사용자 입력 메모:{scope_note}
{memo}
---

위 메모를 분석하여 다음 JSON 형식으로만 응답하세요 (순수 JSON):

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
    return json.loads(_openai_chat(api_key, prompt, model="gpt-4o-mini"))

def ai_preliminary_review_openai(api_key: str, current_plan: dict, review_max_chars: int = 0) -> dict:
    full_content = "\n\n---\n\n".join([
        f"# {SECTION_NAMES[k]}\n\n{current_plan['sections'].get(k, '')[:review_max_chars] if review_max_chars else current_plan['sections'].get(k, '')}"
        for k in SECTION_KEYS
    ])
    prompt = f"""아래 사업계획서를 2026 예술분야 창업지원사업 심사 기준으로 예비 심사하세요.

{full_content}
---

다음 4대 평가 지표 알고리즘으로 채점하세요:
- 지표1 전문성 및 역량(30점): 창업팀 이력-아이템 연관성 키워드 분석 + 예술적 역량 기술의 구체성 및 전문 용어 적절성 평가
- 지표2 제안 사업의 타당성(30점): 수익 모델의 논리적 완결성 + 정부 예산 지침 준수율 + 단계별 목표의 실현 가능성 대조
- 지표3 성장 가능성 및 파급력(20점): 시장 데이터 기반 신뢰도 분석 + VC 투자 트렌드 및 IR 레퍼런스 대비 USP 독창성 기반
- 지표4 예술분야 기여도(20점): 예술 생태계 활성화 구조 분석 + 공공 지원 사업 목적 키워드 일치도 및 사회적 가치 범위 측정

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "indicators": {{
    "ind1_expertise": {{
      "score": 22,
      "max_score": 30,
      "label": "전문성 및 역량",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1", "강점 2"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind2_feasibility": {{
      "score": 22,
      "max_score": 30,
      "label": "제안 사업의 타당성",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind3_growth": {{
      "score": 14,
      "max_score": 20,
      "label": "성장 가능성 및 파급력",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind4_art": {{
      "score": 16,
      "max_score": 20,
      "label": "예술분야 기여도",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }}
  }},
  "validation_check": {{
    "recurring_bm": {{"pass": true, "comment": ""}},
    "art_ecosystem": {{"pass": true, "comment": ""}},
    "fund_ratio": {{"pass": true, "comment": ""}},
    "scaleup_roadmap": {{"pass": true, "comment": ""}}
  }},
  "priority_improvements": ["우선 보완 1", "우선 보완 2", "우선 보완 3"],
  "ai_strategy_report": "정부/VC 레퍼런스 대조 결과를 바탕으로 한 종합 전략 리포트 (3~5문장)",
  "competitive_edge": "경쟁 우위 분석 (2~3문장)",
  "approval_likelihood": "높음/보통/낮음",
  "approval_reason": "그 이유"
}}"""
    return json.loads(_openai_chat(api_key, prompt, model="gpt-4o"))

def ai_update_sections_diff_openai(api_key: str, current_plan: dict, memo: str) -> dict:
    sections_structure = "\n".join([f"- {SECTION_NAMES[k]}" for k in SECTION_KEYS])
    prompt = f"""현재 사업계획서 구조:
{sections_structure}

사용자 메모: "{memo}"

위 메모를 반영하여 '변경된 부분'만 아래 JSON 형식으로 추출하세요.
전체 내용을 다시 쓰지 말고, 수정이 필요한 소제목(target_subhead)과 그 하위 내용만 작성하세요.

{{
  "reason": "업데이트 이유",
  "diff_updates": {{
    "section1": [
      {{
        "target_subhead": "### 시장 현황 및 문제점",
        "new_content": "업데이트된 상세 내용..."
      }}
    ]
  }},
  "summary": "변경 사항 요약",
  "reviewer_comment": "심사위원 관점 제안",
  "warnings": []
}}"""
    return json.loads(_openai_chat(api_key, prompt, model="gpt-4o-mini"))

# ═══════════════════════════════════════════════════
# Claude API
# ═══════════════════════════════════════════════════
def _claude_chat(api_key: str, user_prompt: str, model: str = "claude-haiku-4-5-20251001") -> str:
    client = anthropic.Anthropic(api_key=api_key)
    resp = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return resp.content[0].text

def ai_update_sections_claude(api_key: str, current_plan: dict, memo: str, target_sections: list | None = None) -> dict:
    sections_summary = "\n\n".join([
        f"### {SECTION_NAMES[k]}\n{current_plan['sections'].get(k, '')[:200]}..."
        for k in SECTION_KEYS
    ])
    scope_note = ""
    if target_sections:
        names = [SECTION_NAMES[s] for s in target_sections]
        scope_note = f"\n\n[중요] 반드시 아래 섹션만 업데이트하세요: {', '.join(names)}"

    prompt = f"""---
현재 사업계획서 각 섹션 요약:
{sections_summary}
---
사용자 입력 메모:{scope_note}
{memo}
---

위 메모를 분석하여 다음 JSON 형식으로만 응답하세요 (순수 JSON만):

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
    return json.loads(parse_json_from_text(_claude_chat(api_key, prompt, model="claude-haiku-4-5-20251001")))

def ai_preliminary_review_claude(api_key: str, current_plan: dict, review_max_chars: int = 0) -> dict:
    full_content = "\n\n---\n\n".join([
        f"# {SECTION_NAMES[k]}\n\n{current_plan['sections'].get(k, '')[:review_max_chars] if review_max_chars else current_plan['sections'].get(k, '')}"
        for k in SECTION_KEYS
    ])
    prompt = f"""아래 사업계획서를 2026 예술분야 창업지원사업 심사 기준으로 예비 심사하세요.

{full_content}
---

다음 4대 평가 지표 알고리즘으로 채점하세요:
- 지표1 전문성 및 역량(30점): 창업팀 이력-아이템 연관성 키워드 분석 + 예술적 역량 기술의 구체성 및 전문 용어 적절성 평가
- 지표2 제안 사업의 타당성(30점): 수익 모델의 논리적 완결성 + 정부 예산 지침 준수율 + 단계별 목표의 실현 가능성 대조
- 지표3 성장 가능성 및 파급력(20점): 시장 데이터 기반 신뢰도 분석 + VC 투자 트렌드 및 IR 레퍼런스 대비 USP 독창성 기반
- 지표4 예술분야 기여도(20점): 예술 생태계 활성화 구조 분석 + 공공 지원 사업 목적 키워드 일치도 및 사회적 가치 범위 측정

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "indicators": {{
    "ind1_expertise": {{
      "score": 22,
      "max_score": 30,
      "label": "전문성 및 역량",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1", "강점 2"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind2_feasibility": {{
      "score": 22,
      "max_score": 30,
      "label": "제안 사업의 타당성",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind3_growth": {{
      "score": 14,
      "max_score": 20,
      "label": "성장 가능성 및 파급력",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }},
    "ind4_art": {{
      "score": 16,
      "max_score": 20,
      "label": "예술분야 기여도",
      "algorithm_basis": "이 점수의 산출 근거 (1~2문장)",
      "strengths": ["강점 1"],
      "weaknesses": ["약점 1"],
      "improvement": "개선 제안"
    }}
  }},
  "validation_check": {{
    "recurring_bm": {{"pass": true, "comment": ""}},
    "art_ecosystem": {{"pass": true, "comment": ""}},
    "fund_ratio": {{"pass": true, "comment": ""}},
    "scaleup_roadmap": {{"pass": true, "comment": ""}}
  }},
  "priority_improvements": ["우선 보완 1", "우선 보완 2", "우선 보완 3"],
  "ai_strategy_report": "정부/VC 레퍼런스 대조 결과를 바탕으로 한 종합 전략 리포트 (3~5문장)",
  "competitive_edge": "경쟁 우위 분석 (2~3문장)",
  "approval_likelihood": "높음/보통/낮음",
  "approval_reason": "그 이유"
}}"""
    return json.loads(parse_json_from_text(_claude_chat(api_key, prompt, model="claude-sonnet-4-6")))

def ai_update_sections_diff_claude(api_key: str, current_plan: dict, memo: str) -> dict:
    sections_structure = "\n".join([f"- {SECTION_NAMES[k]}" for k in SECTION_KEYS])
    prompt = f"""현재 사업계획서 구조:
{sections_structure}

사용자 메모: "{memo}"

위 메모를 반영하여 '변경된 부분'만 아래 JSON 형식으로 추출하세요.
전체 내용을 다시 쓰지 말고, 수정이 필요한 소제목(target_subhead)과 그 하위 내용만 작성하세요.

{{
  "reason": "업데이트 이유",
  "diff_updates": {{
    "section1": [
      {{
        "target_subhead": "### 시장 현황 및 문제점",
        "new_content": "업데이트된 상세 내용..."
      }}
    ]
  }},
  "summary": "변경 사항 요약",
  "reviewer_comment": "심사위원 관점 제안",
  "warnings": []
}}"""
    return json.loads(parse_json_from_text(_claude_chat(api_key, prompt, model="claude-haiku-4-5-20251001")))


# ═══════════════════════════════════════════════════
# Unified Resilient AI API with Fallback Cascade
# ═══════════════════════════════════════════════════
def call_ai_with_fallback(
    api_keys: dict,
    prompt: str,
    system_prompt: str = None,
    json_mode: bool = True,
    session_id: str = None,
) -> dict:
    """
    Call AI API with 3-tier fallback cascade (Gemini -> OpenAI -> Claude).
    Uses the resilient client with exponential backoff, caching, and rate limiting.
    
    Args:
        api_keys: Dict with 'Gemini', 'OpenAI', 'Anthropic' keys
        prompt: User prompt
        system_prompt: System instruction
        json_mode: Request JSON response format
        session_id: Session ID for conversation history
    
    Returns:
        dict with 'content', 'used_endpoint', 'from_cache', etc.
    """
    client = get_client({
        'gemini': api_keys.get('Gemini', ''),
        'openai': api_keys.get('OpenAI', ''),
        'anthropic': api_keys.get('Anthropic', ''),
    })
    
    # Determine primary and fallback endpoints based on available keys
    endpoints = []
    if api_keys.get('Gemini'):
        endpoints.append('gemini')
    if api_keys.get('OpenAI'):
        endpoints.append('openai')
    if api_keys.get('Anthropic'):
        endpoints.append('anthropic')
    
    if not endpoints:
        return {
            'content': None,
            'error': 'NO_API_KEYS',
            'message': 'API 키가 설정되지 않았습니다.',
        }
    
    primary = endpoints[0]
    fallbacks = endpoints[1:] if len(endpoints) > 1 else []
    
    return client.call(
        endpoint=primary,
        prompt=prompt,
        system=system_prompt or SYSTEM_PROMPT,
        fallback_endpoints=fallbacks,
        session_id=session_id,
        json_mode=json_mode,
        max_tokens=4096,
        timeout=30.0,
        use_cache=True,
    )

