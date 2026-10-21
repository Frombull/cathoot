import { Controller, Get, Inject, NotFoundException, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { CATALOG_IMAGE_PREFIX } from "../session/cat.js";
import { CATALOG, CATALOG_DIR } from "./catalog.tokens.js";
import type { CatalogCat } from "./catalog.js";

@Controller("cats")
export class CatsController {
  constructor(
    @Inject(CATALOG) private readonly catalog: readonly CatalogCat[],
    @Inject(CATALOG_DIR) private readonly dir: string,
  ) {}

  @Get()
  list() {
    return this.catalog;
  }

  // Só serve o que o catálogo declarou: o nome tem que ser de um gato conhecido
  @Get(":file")
  image(@Param("file") file: string, @Res() res: Response) {
    const known = this.catalog.some((cat) => cat.imageUrl === `${CATALOG_IMAGE_PREFIX}${file}`);
    if (!known) throw new NotFoundException();
    res.sendFile(file, { root: this.dir });
  }
}
