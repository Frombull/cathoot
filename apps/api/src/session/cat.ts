import { DomainError } from "./errors.js";

export interface Cat {
  name: string;
  imageUrl: string;
  crime: string;
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function createCat(input: Cat): Cat {
  const name = input.name.trim();
  const crime = input.crime.trim();

  if (!name) throw new DomainError("CAT_NAME_REQUIRED", "O gato precisa de um nome");
  if (!crime) throw new DomainError("CAT_CRIME_REQUIRED", "O gato precisa de um crime");
  if (!isHttpUrl(input.imageUrl)) {
    throw new DomainError("CAT_IMAGE_URL_INVALID", "A imagem precisa ser uma URL http(s) válida");
  }

  return { name, imageUrl: input.imageUrl, crime };
}
