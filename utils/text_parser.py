import re

def parse_json_from_text(text: str) -> str:
    """AI 응답에서 순수 JSON만 추출"""
    text = text.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if m:
        return m.group(1).strip()
    return text

def apply_diff_update(original_text: str, patch_instructions: list[dict[str, str]]) -> str:
    """
    AI가 준 패치 지시사항을 바탕으로 텍스트를 부분 수정합니다.
    patch_instructions: [{"target_subhead": "### 기존 제목", "new_content": "수정될 내용"}]
    """
    updated_text = original_text
    for patch in patch_instructions:
        target = patch.get("target_subhead", "")
        new_content = patch.get("new_content", "")
        if not target or target not in updated_text:
            continue
        parts = updated_text.split(target, 1)
        next_header_start = parts[1].find("\\n##")
        if next_header_start != -1:
            updated_text = parts[0] + target + "\\n" + new_content + "\\n" + parts[1][next_header_start:]
        else:
            updated_text = parts[0] + target + "\\n" + new_content
    return updated_text
