import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata = {
  title: { default: "ACME Library", template: "%s · ACME Library" },
  description: "Thư viện nội bộ — khám phá, mượn và chia sẻ tri thức.",
  icons: { icon: "/logo-acme.png", apple: "/logo-acme.png" },
};

export default function RootLayout({ children }) {
  return <html lang="vi" suppressHydrationWarning><body className={`${roboto.variable} font-sans antialiased`}><Providers>{children}</Providers></body></html>;
}
