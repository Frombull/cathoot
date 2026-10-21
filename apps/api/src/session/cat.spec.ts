import { describe, expect, it } from "vitest";
import { createCat } from "./cat.js";

const valido = {
  name: "Bolinha",
  imageUrl: "https://exemplo.com/bolinha.png",
  crime: "Derrubou o copo da mesa",
};

describe("createCat", () => {
  it("cria o gato com os dados informados", () => {
    expect(createCat(valido)).toEqual(valido);
  });

  it("remove espaços das pontas do nome e do crime", () => {
    const cat = createCat({ ...valido, name: "  Bolinha ", crime: " Roubou o peixe  " });

    expect(cat.name).toBe("Bolinha");
    expect(cat.crime).toBe("Roubou o peixe");
  });

  it("exige o nome", () => {
    expect(() => createCat({ ...valido, name: "   " })).toThrowError(expect.objectContaining({ code: "CAT_NAME_REQUIRED" }));
  });

  it("exige o crime", () => {
    expect(() => createCat({ ...valido, crime: "" })).toThrowError(expect.objectContaining({ code: "CAT_CRIME_REQUIRED" }));
  });

  it.each(["", "bolinha.png", "ftp://exemplo.com/a.png", "javascript:alert(1)"])(
    "recusa a imagem %j",
    (imageUrl) => {
      expect(() => createCat({ ...valido, imageUrl })).toThrowError(expect.objectContaining({ code: "CAT_IMAGE_URL_INVALID" }));
    },
  );

  it.each(["/cats/12.jpg", "/cats/3.jpeg", "/cats/4.png", "/cats/5.PNG"])("aceita a imagem do catálogo %s", (imageUrl) => {
    expect(createCat({ ...valido, imageUrl }).imageUrl).toBe(imageUrl);
  });

  it.each(["/cats/abc.jpg", "/cats/../segredo.jpg", "/outra/1.jpg", "/cats/1.exe", "/cats/1.svg", "/cats/1.gif", "cats/1.jpg"])(
    "recusa o caminho de imagem %j",
    (imageUrl) => {
      expect(() => createCat({ ...valido, imageUrl })).toThrowError(expect.objectContaining({ code: "CAT_IMAGE_URL_INVALID" }));
    },
  );

  it("aceita imagem http", () => {
    expect(createCat({ ...valido, imageUrl: "http://exemplo.com/a.gif" }).imageUrl).toBe(
      "http://exemplo.com/a.gif",
    );
  });
});
