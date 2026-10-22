import type { Metadata } from "next";
import { normalizeRoomCode } from "@/lib/api";
import { StudentRoom } from "./student-room";

export async function generateMetadata({ params }: PageProps<"/sala/[codigo]">): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Sala ${normalizeRoomCode(codigo)}` };
}

export default async function SalaPage({ params }: PageProps<"/sala/[codigo]">) {
  const { codigo } = await params;
  return <StudentRoom code={normalizeRoomCode(codigo)} />;
}
