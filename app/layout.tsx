import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Cinzel, Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/app/components/ui/sonner"
import { ErrorBoundary } from "@/app/components/shared/ErrorBoundary"
import AuthProvider from "@/app/components/providers/SessionProvider"
import { ThemeProvider } from "@/app/components/theme/ThemeProvider"

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                  
                  var primary = localStorage.getItem('primaryColor');
                  var secondary = localStorage.getItem('secondaryColor');
                  var accent = localStorage.getItem('accentColor');
                  
                  if (primary) {
                    document.documentElement.style.setProperty('--color-primary-custom', primary);
                  }
                  if (secondary) {
                    document.documentElement.style.setProperty('--color-secondary-custom', secondary);
                  }
                  if (accent) {
                    document.documentElement.style.setProperty('--color-accent-custom', accent);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${cinzel.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-primary-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
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