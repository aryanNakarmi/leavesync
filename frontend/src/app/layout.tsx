import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LeaveSync",
  description: "Leave Management System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-on-surface bg-[#F8FAFC]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
