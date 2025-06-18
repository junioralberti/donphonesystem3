// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Habilita a saída "standalone" para empacotamento com Electron
  output: 'standalone',

  typescript: {
    // Para ignorar erros de build do TypeScript. Use com cautela!
    // Idealmente, resolva os erros do TypeScript.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Para ignorar erros do ESLint durante o build. Use com cautela!
    // Idealmente, resolva os erros do ESLint.
    ignoreDuringBuilds: true,
  },
  images: {
    // Configuração para otimização de imagens, incluindo domínios remotos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // Adicione outros domínios de imagem remotos conforme necessário
    ],
  },
  // O bloco 'experimental' agora deve conter apenas recursos realmente experimentais.
  // 'allowedDevOrigins' e 'serverComponentsExternalPackages' não estão mais aqui.
  // Para 'allowedDevOrigins', talvez não seja necessário para configurações do Electron,
  // já que você está carregando localhost. Se precisar adicionar funcionalidade semelhante para o desenvolvimento,
  // consulte a documentação do Next.js para a abordagem mais recente.
  experimental: {
    // Mantenha outras features experimentais aqui, se tiver alguma.
    // Conforme o aviso, 'allowedDevOrigins' provavelmente está descontinuado ou foi movido.
  },
  // 'serverExternalPackages' é o novo local para esta configuração
  serverExternalPackages: [
    'firebase-admin', // Se você usa o Admin SDK em suas API Routes/Server Components
    'firebase'        // Se você usa o SDK do Firebase cliente em seus Server Components/API Routes
  ],
  // Você também pode precisar disso para empacotar módulos Node.js para o Electron em alguns casos
  // webpack(config, { isServer }) {
  //   if (!isServer) {
  //     config.externals = {
  //       ...config.externals,
  //       electron: 'commonjs electron'
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;