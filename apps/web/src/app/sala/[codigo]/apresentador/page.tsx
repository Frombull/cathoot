import type { Metadata } from "next";
import { normalizeRoomCode } from "@/lib/api";
import { PresenterRoom } from "./presenter-room";

export async function generateMetadata({ params }: PageProps<"/sala/[codigo]/apresentador">): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Telão da sala ${normalizeRoomCode(codigo)}` };
}

export default async function ApresentadorPage({ params }: PageProps<"/sala/[codigo]/apresentador">) {
  const { codigo } = await params;
  return <PresenterRoom code={normalizeRoomCode(codigo)} />;
}
