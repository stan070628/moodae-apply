import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";

export const metadata = {
  title: "DIG : 당신이 부르면 공연이 시작됩니다",
  description: "팬덤의 열망을 모아 공연장을 깨우고, 인디씬의 새로운 투명한 생태계를 만듭니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
        <SmoothScroll>
          <CustomCursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
