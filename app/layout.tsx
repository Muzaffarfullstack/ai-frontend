import type { Metadata } from "next";
import { AppProviders } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptUsta — amaliy AI ta’lim platformasi",
  description: "Tasvir va video uchun professional promptlar yozish, amaliy AI kurslari va ko‘nikmalar platformasi.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
