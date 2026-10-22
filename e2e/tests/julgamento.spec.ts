import { devices, expect, test, type Browser, type Page } from "@playwright/test";

// Fluxo principal com dois navegadores: o apresentador (telão) e um aluno (celular).
// Não depende dos nomes do catálogo, que vão mudar: lê o gato da vez na tela.

const PASSWORD = process.env.PRESENTER_PASSWORD ?? "miau";

async function createRoom(browser: Browser) {
  const presenter = await (await browser.newContext()).newPage();
  await presenter.goto("/criar");
  await presenter.getByLabel("Senha do apresentador").fill(PASSWORD);
  await presenter.getByRole("button", { name: "Abrir o tribunal" }).click();
  await expect(presenter).toHaveURL(/\/sala\/[A-Z2-9]{6}\/apresentador$/);
  const code = presenter.url().match(/\/sala\/([A-Z2-9]{6})\//)![1];
  return { presenter, code };
}

// O aluno entra como na sala de aula: digita o código na landing e depois o nome
async function joinRoom(browser: Browser, code: string, name: string) {
  const student = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
  await student.goto("/");
  await student.getByLabel("Código da sala").fill(code.toLowerCase());
  await student.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(student).toHaveURL(`/entrar?codigo=${code.toLowerCase()}`);
  await student.getByLabel("Seu nome").fill(name);
  await student.getByRole("button", { name: "Entrar no tribunal" }).click();
  await expect(student.getByText(`Você está no tribunal, ${name}!`)).toBeVisible();
  return student;
}

const catName = (page: Page) => page.getByRole("heading", { level: 2 }).first();

test("cria a sala, o aluno vota e os dois veem o veredito", async ({ browser }) => {
  const { presenter, code } = await createRoom(browser);
  const student = await joinRoom(browser, code, "Ana");

  // O telão descobre a Ana pelo polling e começa o julgamento
  await expect(presenter.getByRole("list", { name: "Participantes" })).toContainText("Ana");
  await presenter.getByRole("button", { name: "Começar julgamento" }).click();

  const reu = await catName(presenter).textContent();
  await expect(catName(student)).toHaveText(reu!);

  await student.getByRole("button", { name: "Culpado" }).click();
  await expect(student.getByText("Voto registrado!")).toBeVisible();
  await expect(presenter.getByText("1 de 1 pessoa votou")).toBeVisible();

  await presenter.getByRole("button", { name: "Revelar veredito" }).click();
  await expect(presenter.getByText("Culpado!", { exact: true })).toBeVisible();
  await expect(student.getByText("Culpado!", { exact: true })).toBeVisible();
  await expect(student.getByText("A turma concordou com você!")).toBeVisible();
});

test("julga todos os gatos e mostra o resumo com a Prisão da Soneca", async ({ browser }) => {
  const { presenter, code } = await createRoom(browser);
  const student = await joinRoom(browser, code, "Beto");
  await presenter.getByRole("button", { name: "Começar julgamento" }).click();

  const header = await presenter.getByText(/^Réu 1 de \d+$/).textContent();
  const total = Number(header!.match(/de (\d+)/)![1]);
  const primeiro = await catName(presenter).textContent();

  // Condena só o primeiro gato; os outros são absolvidos
  for (let numero = 1; numero <= total; numero++) {
    await expect(student.getByText(`Réu ${numero} de ${total}`)).toBeVisible();
    await student.getByRole("button", { name: numero === 1 ? "Culpado" : "Inocente" }).click();
    await expect(student.getByText("Voto registrado!")).toBeVisible();
    await presenter.getByRole("button", { name: "Revelar veredito" }).click();
    const ultimo = numero === total;
    await presenter.getByRole("button", { name: ultimo ? "Ver resumo final" : "Próximo gato" }).click();
  }

  for (const page of [presenter, student]) {
    await expect(page.getByRole("heading", { name: "Fim do julgamento!" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Gatos condenados" }).getByRole("listitem")).toHaveText([primeiro!]);
    await expect(page.getByText("1 voto de culpado")).toBeVisible();
  }
});

test("senha errada não cria sala", async ({ page }) => {
  await page.goto("/criar");
  await page.getByLabel("Senha do apresentador").fill("senha-errada");
  await page.getByRole("button", { name: "Abrir o tribunal" }).click();

  // getByRole("alert") pegaria também o anunciador de rotas do Next
  await expect(page.getByText("Senha errada! Só o juiz pode abrir o tribunal.")).toBeVisible();
  await expect(page).toHaveURL("/criar");
});
