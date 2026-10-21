import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { CATALOG_IMAGE_EXTENSIONS, CATALOG_IMAGE_PREFIX, createCat, type Cat } from "../session/cat.js";
import { DomainError } from "../session/errors.js";

export interface CatalogCat extends Cat {
  id: number;
}

export const CATALOG_FILE = "gatos.yaml";

// apps/api/catalog, tanto a partir de src/ quanto de dist/
export const DEFAULT_CATALOG_DIR = fileURLToPath(new URL("../../catalog/", import.meta.url));

const text = (value: unknown) => (typeof value === "string" ? value : "");

// Formato: "<id>:" com "nome:" e "crime:" embaixo. O que faltar fica vazio e createCat reclama.
export function parseCatalogFile(content: string) {
  let data: unknown;
  try {
    data = parse(content);
  } catch (e) {
    throw new DomainError("CATALOG_FILE_INVALID", `${CATALOG_FILE} inválido: ${(e as Error).message}`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new DomainError("CATALOG_FILE_INVALID", `${CATALOG_FILE} precisa listar os gatos por id (1:, 2:, ...)`);
  }

  return Object.entries(data)
    .map(([key, entry]) => {
      if (!/^\d+$/.test(key)) {
        throw new DomainError("CATALOG_FILE_INVALID", `${CATALOG_FILE}: "${key}" não é um id de gato`);
      }
      const { nome, crime } = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
      return { id: Number(key), name: text(nome), crime: text(crime) };
    })
    .sort((a, b) => a.id - b.id);
}

function readImages(dir: string) {
  const images = new Map<number, string[]>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const match = entry.isFile() && /^(\d+)\.([a-z0-9]+)$/i.exec(entry.name);
    if (!match || !CATALOG_IMAGE_EXTENSIONS.includes(match[2].toLowerCase())) continue;
    const id = Number(match[1]);
    images.set(id, [...(images.get(id) ?? []), entry.name]);
  }
  return images;
}

export function loadCatalog(dir: string = DEFAULT_CATALOG_DIR): CatalogCat[] {
  let content: string;
  try {
    content = readFileSync(join(dir, CATALOG_FILE), "utf8");
  } catch {
    throw new DomainError("CATALOG_FILE_MISSING", `Não encontrei ${CATALOG_FILE} em ${dir}`);
  }

  const entries = parseCatalogFile(content);
  const images = readImages(dir);

  for (const id of images.keys()) {
    if (!entries.some((e) => e.id === id)) {
      throw new DomainError("CATALOG_ENTRY_MISSING", `Gato ${id}: tem imagem, mas não está no ${CATALOG_FILE}`);
    }
  }

  return entries.map(({ id, name, crime }) => {
    const files = images.get(id) ?? [];
    if (files.length === 0) throw new DomainError("CATALOG_IMAGE_MISSING", `Gato ${id}: falta a imagem ${id}.jpg ou ${id}.png`);
    if (files.length > 1) {
      throw new DomainError("CATALOG_IMAGE_DUPLICATED", `Gato ${id}: mais de uma imagem (${files.join(", ")})`);
    }
    try {
      return { id, ...createCat({ name, crime, imageUrl: `${CATALOG_IMAGE_PREFIX}${files[0]}` }) };
    } catch (e) {
      if (e instanceof DomainError) throw new DomainError(e.code, `Gato ${id}: ${e.message}`);
      throw e;
    }
  });
}
