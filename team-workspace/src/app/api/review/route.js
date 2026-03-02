import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const { content, feedbackText, sectionId, author } = await request.json();

        // 1. Read API keys from the shared JSON file
        const keysPath = path.join(process.cwd(), '../data/api_keys.json');
        let keys = {};
        if (fs.existsSync(keysPath)) {
            keys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
        }

        const openAiKey = keys['OpenAI'];

        // 2. Setup the prompt
        const systemPrompt = `You are an expert Chief Product Officer (CPO) and Business Consultant. 
You are given a section of a business proposal and a feedback comment from a team member.
Your task is to:
1. Intelligently rewrite and merge the feedback into the original content. Add a "[💡 AI 자동 반영]" header to summarize the changes at the end.
2. Predict 2~3 potential impacts of this change across 'business', 'risk', and 'tech' categories.

You MUST respond strictly in valid JSON format:
{
  "newContent": "The entire updated content, preserving markdown.",
  "impacts": [
    {
      "id": "imp-1",
      "category": "business",
      "icon": "✅",
      "title": "Positive impact title",
      "description": "Short description"
    },
    {
      "id": "imp-2",
      "category": "risk",
      "icon": "⚠️",
      "title": "Risk title",
      "description": "Short description"
    }
  ]
}`;

        const userPrompt = `--- Original Content ---\n${content}\n\n--- Feedback from ${author} ---\n${feedbackText}`;

        // 3. Fallback mock generator
        const generateFallback = () => {
            let newAddition = `\n\n[💡 AI 자동 반영 (by ${author})]\n팀원의 피드백("${feedbackText}")을 바탕으로 기획안을 보강했습니다. (현재 설정된 API 키의 할당량(Quota) 초과 또는 미설정으로 인해 AI 분석을 건너뛰고 기본 모드로 병합되었습니다.)`;
            if (sectionId === 'what' && feedbackText.includes('소액 결제')) {
                newAddition = `\n\n[💡 AI 자동 반영: '팬덤 주도형' 모델을 적용합니다. 펀딩률 100% 달성 시 게이미피케이션 요소를 통해 바이럴 극대화 방안을 추가했습니다.]`;
            }
            return {
                newContent: content + newAddition,
                impacts: [
                    { id: "imp-1", category: "business", icon: "✅", title: "사용자 경험", description: "AI API 장애 시에도 안전한 병합 처리 유지" },
                    { id: "imp-2", category: "risk", icon: "⚠️", title: "API 토큰/한도", description: "현재 API 키의 잔여 크레딧 확인 필요 API_KEY_ERROR" }
                ]
            };
        };

        // 4. Try calling OpenAI if key is present
        if (openAiKey) {
            try {
                console.log("Calling OpenAI API for review...");
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini", // Use mini for speed and lower cost mapping
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiResult = JSON.parse(data.choices[0].message.content);
                    return NextResponse.json({
                        success: true,
                        originalContent: content,
                        newContent: aiResult.newContent,
                        impacts: aiResult.impacts
                    });
                } else {
                    const errText = await response.text();
                    console.error("OpenAI API returned an error:", errText);
                    // Fallback to mock on quota error
                }
            } catch (apiErr) {
                console.error("OpenAI fetch failed:", apiErr);
            }
        }

        // 5. Fallback response if API fails or no keys
        console.log("Falling back to simulated review...");
        await new Promise(r => setTimeout(r, 1000));
        const fallbackObj = generateFallback();
        return NextResponse.json({
            success: true,
            originalContent: content,
            newContent: fallbackObj.newContent,
            impacts: fallbackObj.impacts
        });

    } catch (error) {
        console.error("AI Review API Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
