"use client";

import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const subscribeNothing = () => () => {};

// O endereço só existe no navegador; no servidor fica null
function useLocation() {
  return useSyncExternalStore(subscribeNothing, () => window.location, () => null);
}

// QR code e código da sala para o telão. O QR leva ao mesmo endereço do formulário da landing.
export function JoinQr({ code }: { code: string }) {
  const location = useLocation();
  const joinUrl = location ? `${location.origin}/entrar?codigo=${code}` : null;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-4xl border-4 border-card bg-white p-4 shadow-2xl shadow-primary/25">
        {joinUrl ? (
          <QRCodeSVG
            value={joinUrl}
            size={256}
            marginSize={1}
            fgColor="#2a2040"
            bgColor="#ffffff"
            title="QR code para entrar na sala"
            className="h-auto w-56 sm:w-64"
          />
        ) : (
          <div className="aspect-square w-56 sm:w-64" />
        )}
      </div>
      <div>
        <p className="font-display text-lg text-muted-foreground">
          ou entre em <strong className="text-foreground">{location?.host ?? ""}</strong> com o código
        </p>
        <p className="font-display text-6xl font-bold tracking-[0.15em] text-primary sm:text-7xl">{code}</p>
      </div>
      {location && LOCAL_HOSTS.has(location.hostname) && (
        <p className="max-w-xs rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
          Dica: abra este painel pelo IP da rede (ex.: http://192.168.0.10:3000), senão o QR leva os celulares ao
          localhost deles.
        </p>
      )}
    </div>
  );
}
