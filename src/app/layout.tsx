import type { Metadata } from "next";
import { Mali } from "next/font/google";
import "./style/globals.css";

const mali = Mali({
  variable: "--font-mali",
  subsets: ["latin", "thai"],
  weight: ["300", "500", "700"],
});

export const metadata: Metadata = {
  title: "MyDev",
  description: "MyDev is a platform for developers to share and learn from each other.",
  icons: {
    icon: "/RoundLogo.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mali.variable} antialiased`}>
          {children}
      </body>
    </html>
  );
}
