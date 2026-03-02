import json
import google.generativeai as genai
from openai import OpenAI
import anthropic

from core.prompts import SYSTEM_PROMPT, SECTION_KEYS, SECTION_NAMES
from utils.text_parser import parse_json_from_text

# ═══════════════════════════════════════════════════
# Gemini API
# ═══════════════════════════════════════════════════
def get_model(api_key: str, pro: bool = False):
    genai.configure(api_key=api_key)
    model_name = "gemini-2.0-flash" if pro else "gemini-2.0-flash"
    return genai.GenerativeModel(model_name)

def ai_update_sections(api_key: str, current_plan: dict, memo: str, target_sections: list | None = None) -> dict:
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
    return json.loads(parse_json_from_text(resp.text))

def ai_preliminary_review(api_key: str, current_plan: dict) -> dict:
    model = get_model(api_key, pro=True)
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
    return json.loads(parse_json_from_text(resp.text))

def ai_update_sections_diff(api_key: str, current_plan: dict, memo: str) -> dict:
    model = get_model(api_key)
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
    resp = model.generate_content(prompt)
    return json.loads(parse_json_from_text(resp.text))

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

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "section_reviews": {{
    "section1": {{"score": 80, "strengths": ["강점 1"], "weaknesses": ["약점 1"], "suggestions": "개선 제안"}},
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

다음 JSON 형식으로만 응답하세요 (순수 JSON):

{{
  "overall_score": 75,
  "grade": "B+",
  "overall_comment": "전체적인 평가 (2~3문장)",
  "section_reviews": {{
    "section1": {{"score": 80, "strengths": ["강점 1"], "weaknesses": ["약점 1"], "suggestions": "개선 제안"}},
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
