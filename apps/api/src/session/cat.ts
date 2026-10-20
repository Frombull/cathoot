import { DomainError } from "./errors.js";

export interface Cat {
  name: string;
  imageUrl: string;
  crime: string;
}

// Imagens do catálogo são servidas pela própria API em /cats/<id>.<extensão>
export const CATALOG_IMAGE_PREFIX = "/cats/";
export const CATALOG_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const CATALOG_IMAGE_PATH = new RegExp(`^${CATALOG_IMAGE_PREFIX}\\d+\\.(${CATALOG_IMAGE_EXTENSIONS.join("|")})$`, "i");

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
  if (!isHttpUrl(input.imageUrl) && !CATALOG_IMAGE_PATH.test(input.imageUrl)) {
    throw new DomainError("CAT_IMAGE_URL_INVALID", "A imagem precisa ser uma URL http(s) ou uma imagem do catálogo");
  }

  return { name, imageUrl: input.imageUrl, crime };
}
