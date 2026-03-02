import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path to the shared workspace DB file
const dbPath = path.join(process.cwd(), '../data/workspace_db.json');

// Default initial data if the file doesn't exist
const defaultDbData = {
    planData: {
        id: "plan-1",
        title: "DIG 프로젝트 제안서",
        progress: 45,
        lastUpdated: "방금 전",
        sections: [
            { id: 'why', title: 'WHY (문제 정의)', content: "현재 대한민국의 인디 공연 생태계는 심각한 불균형과 '데스 밸리(Death Valley)'에 빠져 있습니다.\n\n아티스트의 만성 적자: 예술 활동 월평균 소득은 150.7만 원에 불과하며, 사비로 대관료를 지불하고 노쇼(No-show)의 두려움에 떨어야 합니다." },
            { id: 'what', title: 'WHAT (핵심 컨셉)', content: "최근 Z세대의 핵심 소비 트렌드인 '디깅(Digging, 숨겨진 원석을 깊게 파고드는 행위)'에서 착안한 수요 기반의 인디 공연 유통 플랫폼(OS)입니다.\n\n비플랫폼 기반 O2O 소규모 공연 매칭 서비스 개발. 팬들이 아티스트를 소환하고 결제가 오픈되면 공연이 확정되는 모델 적용." },
            { id: 'who', title: 'WHO (타겟 고객)', content: "1. 큐레이터 및 관객 (2030 디깅 세대)\n2. 공연장 및 복합문화공간 (사업자)\n3. 인디 아티스트 (공급자)" },
            { id: 'how', title: 'HOW TO WIN (경쟁 우위)', content: "독점적 특허 확보: 단순한 중개 앱이 아닌 '특정 지역/장르별 실시간 공연 소환 지수'를 도출하는 '공연 수요 예측 시스템'으로 BM 특허를 출원하여 경쟁사의 진입을 방어합니다." },
            { id: 'agenda', title: '논의 안건', content: "1. 초기 마케팅 비용 조달 방안\n2. 결제 수수료율 책정 기준" }
        ]
    },
    feedbacks: [
        { id: 1, sectionId: 'what', author: '김과장(마케팅)', category: '아이디어', text: '소규모 결제 오픈 방식이 크라우드 펀딩 느낌이 강하네요. 팬덤 주도형 이라는 키워드를 강조하고, 티켓팅 100% 달성 시 폭죽이 터지는 등 게이미피케이션 요소를 넣자는 기획을 반영해주세요.', time: '1시간 전' },
        { id: 2, sectionId: 'what', author: 'CTO(개발)', category: '리스크', text: '웹 앱 구조상 티켓팅 동시 접속이 몰릴 경우 트랜잭션 에러 리스크가 큽니다. 대기열 시스템 도입이나 트래픽 분산 설계를 아키텍처에 명시해야 합니다.', time: '30분 전' }
    ]
};

function readDb() {
    if (!fs.existsSync(dbPath)) {
        // If directory doesn't exist, create it (should exist in this repo structure, but safe)
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify(defaultDbData, null, 2), 'utf-8');
        return defaultDbData;
    }
    const raw = fs.readFileSync(dbPath, 'utf-8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        return defaultDbData;
    }
}

function writeDb(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    const data = readDb();
    return NextResponse.json({ success: true, data });
}

export async function POST(request) {
    try {
        const { action, payload } = await request.json();
        const db = readDb();

        if (action === 'MERGE_SECTION') {
            const { sectionId, newContent, newFeedback, aiFeedback } = payload;
            // Update plan content
            db.planData.sections = db.planData.sections.map(sec =>
                sec.id === sectionId ? { ...sec, content: newContent } : sec
            );
            // Append feedbacks
            db.feedbacks.push(newFeedback);
            if (aiFeedback) {
                db.feedbacks.push(aiFeedback);
            }
            db.planData.lastUpdated = "방금 전";
            writeDb(db);
        }

        return NextResponse.json({ success: true, data: db });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
