import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Manrope } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import ConditionalLayout from '@/components/layout/conditional-layout';
import AnalyticsProvider from '@/components/analytics/analytics-provider';
import { Toaster } from '@/components/ui/sonner';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ARK Dumpster Rentals',
  description: 'Your go-to solution for dumpster rentals and waste management.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AnalyticsProvider>
          <Toaster position="top-center" />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
