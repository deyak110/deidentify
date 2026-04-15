import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHI De-Identifier",
  description: "Accessible browser-based de-identification tool for clinical text.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}