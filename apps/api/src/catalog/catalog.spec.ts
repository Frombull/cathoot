import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CATALOG_DIR, loadCatalog, parseCatalogFile } from "./catalog.js";

const erro = (code: string) => expect.objectContaining({ code });

describe("parseCatalogFile", () => {
  it("lê nome e crime de cada id", () => {
    const texto = "1:\n  nome: Bolinha\n  crime: Bebeu água do esgoto\n2:\n  nome: Mingau\n  crime: Roubou o peixe\n";

    expect(parseCatalogFile(texto)).toEqual([
      { id: 1, name: "Bolinha", crime: "Bebeu água do esgoto" },
      { id: 2, name: "Mingau", crime: "Roubou o peixe" },
    ]);
  });

  it("ordena pelo número do id, não pelo texto", () => {
    const texto = ["10", "2", "1"].map((id) => `${id}:\n  nome: G${id}\n  crime: C${id}\n`).join("");

    expect(parseCatalogFile(texto).map((c) => c.id)).toEqual([1, 2, 10]);
  });

  it("deixa vazio o que faltar, para a validação do gato avisar", () => {
    expect(parseCatalogFile("1:\n  nome: Bolinha\n")).toEqual([{ id: 1, name: "Bolinha", crime: "" }]);
    expect(parseCatalogFile("1:\n  crime: Bebeu água\n")).toEqual([{ id: 1, name: "", crime: "Bebeu água" }]);
  });

  it.each([
    ["YAML quebrado", "1: [\n"],
    ["arquivo vazio", ""],
    ["lista no lugar de mapa", "- nome: Bolinha\n"],
    ["id que não é número", "abc:\n  nome: Bolinha\n  crime: X\n"],
    ["id repetido", "1:\n  nome: A\n  crime: X\n1:\n  nome: B\n  crime: Y\n"],
  ])("recusa %s", (_, texto) => {
    expect(() => parseCatalogFile(texto)).toThrowError(erro("CATALOG_FILE_INVALID"));
  });
});

describe("loadCatalog", () => {
  let dir: string;

  const escrever = (nome: string, conteudo = "x") => writeFileSync(join(dir, nome), conteudo);
  const gatos = (...ids: number[]) =>
    escrever("gatos.yaml", ids.map((id) => `${id}:\n  nome: Gato ${id}\n  crime: Crime ${id}\n`).join(""));

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cathoot-catalog-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("junta cada gato do arquivo à imagem de mesmo id", () => {
    gatos(1);
    escrever("1.png");

    expect(loadCatalog(dir)).toEqual([{ id: 1, name: "Gato 1", crime: "Crime 1", imageUrl: "/cats/1.png" }]);
  });

  it("entrega os gatos na ordem do id", () => {
    gatos(10, 2, 1);
    for (const id of [1, 2, 10]) escrever(`${id}.jpg`);

    expect(loadCatalog(dir).map((c) => c.id)).toEqual([1, 2, 10]);
  });

  it("ignora arquivos que não são imagem de gato", () => {
    gatos(1);
    escrever("1.jpg");
    escrever("README.md");
    escrever(".gitkeep", "");
    escrever("1.svg");
    mkdirSync(join(dir, "rascunhos"));

    expect(loadCatalog(dir).map((c) => c.id)).toEqual([1]);
  });

  it("falha quando não existe o gatos.yaml", () => {
    escrever("1.jpg");

    expect(() => loadCatalog(dir)).toThrowError(erro("CATALOG_FILE_MISSING"));
  });

  it("falha quando o gato do arquivo não tem imagem", () => {
    gatos(1);

    expect(() => loadCatalog(dir)).toThrowError(erro("CATALOG_IMAGE_MISSING"));
    expect(() => loadCatalog(dir)).toThrowError(/gato 1/i);
  });

  it("falha quando há imagem de um gato que não está no arquivo", () => {
    gatos(1);
    escrever("1.jpg");
    escrever("2.png");

    expect(() => loadCatalog(dir)).toThrowError(erro("CATALOG_ENTRY_MISSING"));
    expect(() => loadCatalog(dir)).toThrowError(/gato 2/i);
  });

  it("falha quando o mesmo id tem duas imagens", () => {
    gatos(1);
    escrever("1.jpg");
    escrever("1.png");

    expect(() => loadCatalog(dir)).toThrowError(erro("CATALOG_IMAGE_DUPLICATED"));
  });

  it("diz qual gato está inválido", () => {
    escrever("gatos.yaml", "7:\n  nome: Gato 7\n");
    escrever("7.jpg");

    expect(() => loadCatalog(dir)).toThrowError(/gato 7/i);
    expect(() => loadCatalog(dir)).toThrowError(erro("CAT_CRIME_REQUIRED"));
  });
});

describe("catálogo do repositório", () => {
  it("tem ao menos um gato e todos estão válidos", () => {
    expect(loadCatalog(DEFAULT_CATALOG_DIR).length).toBeGreaterThan(0);
  });
});
