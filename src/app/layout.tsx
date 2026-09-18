import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "JU Campus Connect",
  description: "Text-based dating app for Jahangirnagar University",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
