import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeContextProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BabyBot Dashboard",
  description:
    "Dashboard inteligente para acompanhar o desenvolvimento do seu bebê",
  keywords: [
    "bebê",
    "criança",
    "desenvolvimento",
    "sono",
    "alimentação",
    "crescimento",
  ],
  authors: [{ name: "BabyBot Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeContextProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
