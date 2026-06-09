import type { Metadata } from "next";
import { Bangers, Nunito } from "next/font/google";
import "./globals.css";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

const nunito = Nunito({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Totem 90s Burgers",
  description: "Totem de Autoatendimento 90s Burgers",
};

import { Providers } from "@/components/providers";
import { IdleTimerProvider } from "@/components/IdleTimerProvider";
import { LanguageProvider } from "@/lib/i18n/i18n";
import { HealthGate } from "@/components/HealthGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${bangers.variable} ${nunito.variable} font-nunito antialiased text-popBlack overflow-hidden`}
      >
        <Providers>
          <LanguageProvider>
            <HealthGate>
              <IdleTimerProvider>{children}</IdleTimerProvider>
            </HealthGate>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
