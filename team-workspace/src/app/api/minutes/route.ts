import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
            { status: 500 }
        );
    }

    try {
        const { itemName, messages } = await req.json();

        if (!itemName || !messages || messages.length < 2) {
            return NextResponse.json(
                { error: "항목명과 최소 2개의 메시지가 필요합니다." },
                { status: 400 }
            );
        }

        const chatLog = messages
            .map((m: { author: string; text: string }) => `${m.author}: ${m.text}`)
            .join("\n");

        const today = new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const prompt = `아래 채팅 내용을 바탕으로 회의록을 작성해주세요.

항목명: ${itemName}
날짜: ${today}

채팅 내용:
${chatLog}

아래 형식으로 작성해주세요:

📝 회의록 | ${itemName} | ${today}

🔑 결정 사항
- (채팅에서 합의된 내용을 정리)

✅ 액션 아이템
- [ ] 담당자: 할일 (~날짜)

💬 주요 논의 요약
(채팅 내용을 요약)`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2048,
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json(
                { error: `Claude API 오류: ${response.status}`, details: err },
                { status: response.status }
            );
        }

        const data = await response.json();
        const minutes = data.content?.[0]?.text || "회의록 생성 실패";

        return NextResponse.json({ minutes });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "알 수 없는 오류";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
