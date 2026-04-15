import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KapacitetNet",
  description: "Capacity coordination platform authentication and onboarding",
  icons: {
    icon: "/brand/kapacitet-logo.png",
  },
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
