import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "続きどこ? | Where Was I?",
  description: "ピッコマの読書進捗とチケット管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
