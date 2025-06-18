
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using next/font for Inter as it's common practice
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import QueryProvider from '@/context/query-provider';

// If you want to use Google Fonts CSS directly, you'd do this:
// const inter = { className: '' }; // Placeholder if not using next/font
// And keep the <link> tags for Inter in <head>

export const metadata: Metadata = {
  title: 'Sistema DonPhone',
  description: 'Sistema DonPhone - Gerenciamento de Ordens de Serviço',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
