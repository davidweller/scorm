import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCORM Course Builder",
  description: "AI-assisted SCORM course authoring and export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
