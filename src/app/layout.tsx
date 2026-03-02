import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCORM Builder",
  description: "Turn minimal input into a fully structured, interactive, SCORM-ready course.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
