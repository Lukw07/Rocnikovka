import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/app/components/ui/sonner"
import { ErrorBoundary } from "@/app/components/ErrorBoundary"
import AuthProvider from "@/src/components/providers/SessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduRPG - Školní gamifikační platforma",
  description: "RPG-stylovaná platforma pro gamifikaci vzdělávání s úkoly, XP, úspěchy a obchodem.",
  keywords: ["gamifikace", "vzdělávání", "škola", "RPG", "úkoly", "XP"],
  authors: [{ name: "EduRPG Team" }],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");`}
          </Script>
        )}
      </body>
    </html>
  )
}