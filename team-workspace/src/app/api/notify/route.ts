import { NextRequest, NextResponse } from "next/server";

// firebase-admin 초기화 (서버 전용)
let adminInitialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminApp: any = null;

async function getAdmin() {
    if (adminInitialized) return adminApp;
    try {
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) {
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT not set");
            const serviceAccount = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
        adminApp = admin;
        adminInitialized = true;
        return admin;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const { mentions, senderName, itemName, text, itemId, notifyAll } = await req.json();
    console.log("[notify] 요청 수신:", { senderName, itemName, itemId, notifyAll, mentions });

    const admin = await getAdmin();
    if (!admin) {
        console.log("[notify] Admin SDK 초기화 실패");
        return NextResponse.json({ success: false, error: "Admin SDK not initialized" });
    }
    console.log("[notify] Admin SDK 초기화 성공");

    const firestore = admin.firestore();

    // 전체 팀원 조회 (notifyAll 또는 @ALL 멘션 시 필요)
    const hasAll = (mentions as string[])?.includes("ALL");
    let allMembers: string[] = [];
    if (notifyAll || hasAll) {
        try {
            const usersSnap = await firestore.collection("users").get();
            allMembers = usersSnap.docs.map((d) => d.id);
            console.log("[notify] 전체 팀원:", allMembers);
        } catch (e) { console.log("[notify] 팀원 조회 오류:", e); }
    }

    const targets: string[] = [];
    if (notifyAll) {
        // 멘션 없는 일반 메시지 → 발신자 제외 전체 팀원에게 알림
        allMembers.forEach((member) => {
            if (member !== senderName) targets.push(member);
        });
    } else {
        if (!mentions || mentions.length === 0) {
            return NextResponse.json({ success: true, sent: 0 });
        }
        (mentions as string[]).forEach((m) => {
            if (m === "ALL") {
                allMembers.forEach((member) => {
                    if (member !== senderName && !targets.includes(member)) targets.push(member);
                });
            } else if (m !== senderName && !targets.includes(m)) {
                targets.push(m);
            }
        });
    }

    console.log("[notify] 수신 대상:", targets);
    if (targets.length === 0) return NextResponse.json({ success: true, sent: 0 });

    const title = "IN-DIG Collab";
    const preview = text.length > 20 ? text.substring(0, 20) + "..." : text;
    const body = notifyAll
        ? `${senderName}님이 #${itemName}에 메시지를 보냈습니다. ${preview}`
        : `${senderName}님이 #${itemName}에서 멘션했습니다. ${preview}`;
    const url = `/board?item=${itemId}`;

    // 수신자별 총 미읽은 카운트 계산 (뱃지용)
    let badgeCounts: Record<string, number> = {};
    try {
        const wbsSnap = await firestore.collection("wbs").get();
        targets.forEach((nick) => {
            let total = 0;
            wbsSnap.docs.forEach((d) => {
                const data = d.data();
                total += (data.chatCounts?.[nick] || 0) + (data.mentionCounts?.[nick] || 0);
            });
            badgeCounts[nick] = Math.max(total, 1);
        });
    } catch { /* ignore */ }

    const messaging = admin.messaging();
    const results = await Promise.allSettled(
        targets.map(async (nick) => {
            const snap = await firestore.doc(`users/${nick}`).get();
            const token = snap.data()?.fcmToken;
            console.log(`[notify] ${nick} 토큰:`, token ? token.substring(0, 20) + "..." : "없음");
            if (!token) return;
            return messaging.send({
                token,
                notification: { title, body },
                webpush: {
                    fcmOptions: { link: url },
                    notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
                },
                // apns: iOS 홈 화면 배지를 APNs 레벨에서 직접 설정
                apns: {
                    payload: {
                        aps: {
                            badge: badgeCounts[nick] ?? 1,
                        },
                    },
                },
                // data 필드: SW raw push 이벤트에서 뱃지 카운트 읽기용
                data: { badgeCount: String(badgeCounts[nick] ?? 1), url },
            });
        })
    );

    const sent = results.filter((r: PromiseSettledResult<unknown>) => r.status === "fulfilled").length;
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    failed.forEach((r, i) => console.log(`[notify] FCM 전송 실패 [${i}]:`, r.reason));
    console.log("[notify] 완료 — 성공:", sent, "/ 전체:", results.length);
    return NextResponse.json({ success: true, sent });
}
