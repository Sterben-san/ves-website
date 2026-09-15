import type { Metadata } from "next";
import { InternalHashNavigation } from "./(public)/components/InternalHashNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vishwakarma Evolution Solutions | Innovating for a Sustainable Future",
  description:
    "Vishwakarma Evolution Solutions builds streetlight automation and field-ready public-infrastructure systems for local governments and rural communities.",
  icons: {
    icon: "/brand/ves-logo-mark.png",
    apple: "/brand/ves-logo-mark.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <InternalHashNavigation />
        {children}
      </body>
    </html>
  );
}
