import type { NextConfig } from "next";

// Endereço da API visto pelo servidor do Next. Os rewrites são gerados no build,
// então na imagem Docker ele vem de um ARG (ver apps/web/Dockerfile).
const apiUrl = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Necessário para a imagem Docker
  output: "standalone",

  // O navegador só fala com o web: /api/* e as imagens do catálogo (/cats/*) são repassadas para a API.
  // Assim não precisa de CORS nem de saber o endereço da API no front.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/:path*` },
      { source: "/cats/:path*", destination: `${apiUrl}/cats/:path*` },
    ];
  },
};

export default nextConfig;
