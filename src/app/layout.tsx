import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asset Intelligence Copilot",
  description: "Ask plain-English questions about the well fleet and get cited, visual answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
