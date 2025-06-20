// src/app/layout.tsx (Este é o layout raiz GLOBAL do seu aplicativo Next.js)
import type { Metadata } from 'next';
// Não precisa importar Inter, pois está sendo feito em (app)/layout.tsx (AppLayout)
// import { Inter } from 'next/font/google'; 
import './globals.css'; // Mantenha a importação global de CSS
import { Toaster } from '@/components/ui/toaster'; // Importe Toaster
import { AuthProvider } from '@/context/auth-context'; // Importe AuthProvider
import QueryProvider from '@/context/query-provider'; // Importe QueryProvider

// Seus metadados globais
export const metadata: Metadata = {
  title: 'Sistema DonPhone',
  description: 'Sistema DonPhone - Gerenciamento de Ordens de Serviço',
};

// Este é o RootLayout que engloba TODO o seu aplicativo
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* Head section pode conter links de fontes globais, etc. */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {/* Envolva TUDO com QueryProvider e AuthProvider */}
        <QueryProvider>
          <AuthProvider>
            {children} {/* Este 'children' é o seu AppLayout (de (app)/layout.tsx) e todas as suas páginas */}
            <Toaster /> {/* O Toaster também pode ser global */}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}