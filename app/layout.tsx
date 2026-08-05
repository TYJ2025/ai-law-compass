import type { Metadata } from "next";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl + "/"),
  title: "AI Law Compass｜全球 AI 法規情報",
  description:
    "為企業法遵團隊整理全球 AI 法規、監管更新、官方原文與重要期限。",
  openGraph: {
    title: "AI Law Compass｜全球 AI 法規情報",
    description: "Regulatory intelligence for compliance teams",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: siteUrl + "/og.png",
        width: 1200,
        height: 630,
        alt: "AI Law Compass 全球 AI 法規情報",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Law Compass｜全球 AI 法規情報",
    description: "Regulatory intelligence for compliance teams",
    images: [siteUrl + "/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
