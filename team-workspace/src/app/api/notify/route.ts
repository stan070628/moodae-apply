import { NextRequest, NextResponse } from "next/server";
import { TEAM } from "@/lib/data";

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
    const { mentions, senderName, itemName, text, itemId } = await req.json();

    if (!mentions || mentions.length === 0) {
        return NextResponse.json({ success: true, sent: 0 });
    }

    const admin = await getAdmin();
    if (!admin) {
        return NextResponse.json({ success: false, error: "Admin SDK not initialized" });
    }

    // @ALL 처리 — 보낸 사람 제외한 전 팀원
    const targets: string[] = [];
    (mentions as string[]).forEach((m) => {
        if (m === "ALL") {
            TEAM.forEach((member) => {
                if (member !== senderName && !targets.includes(member)) targets.push(member);
            });
        } else if (m !== senderName && !targets.includes(m)) {
            targets.push(m);
        }
    });

    if (targets.length === 0) return NextResponse.json({ success: true, sent: 0 });

    // Firestore에서 FCM 토큰 조회
    const firestore = admin.firestore();
    const tokens: string[] = [];
    await Promise.all(
        targets.map(async (nick) => {
            try {
                const snap = await firestore.doc(`users/${nick}`).get();
                const token = snap.data()?.fcmToken;
                if (token) tokens.push(token);
            } catch { /* ignore */ }
        })
    );

    if (tokens.length === 0) return NextResponse.json({ success: true, sent: 0 });

    const title = "IN-DIG Collab";
    const preview = text.length > 20 ? text.substring(0, 20) + "..." : text;
    const body = `${senderName}님이 #${itemName}에서 멘션했습니다. ${preview}`;
    const url = `/board?item=${itemId}`;

    const messaging = admin.messaging();
    const results = await Promise.allSettled(
        tokens.map((token: string) =>
            messaging.send({
                token,
                notification: { title, body },
                webpush: {
                    fcmOptions: { link: url },
                    notification: { icon: "/icon-192.png" },
                },
            })
        )
    );

    return NextResponse.json({
        success: true,
        sent: results.filter((r: PromiseSettledResult<unknown>) => r.status === "fulfilled").length,
    });
}
