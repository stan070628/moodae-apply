import "./globals.css";
import type { Metadata, Viewport } from "next";
import AppProvider from "@/components/AppProvider";

export const metadata: Metadata = {
    title: "IN-DIG Collab",
    description: "인디 공연 플랫폼 팀 협업툴 — WBS 보드 · 채팅 · AI 회의록",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "IN-DIG",
    },
    icons: {
        apple: "/icons/icon-180x180.png",
    },
};

export const viewport: Viewport = {
    themeColor: "#6C5CE7",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
                />
            </head>
            <body className="antialiased min-h-screen">
                <AppProvider>{children}</AppProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', () => {
                                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
