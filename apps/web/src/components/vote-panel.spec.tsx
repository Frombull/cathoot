import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VotePanel } from "./vote-panel";

describe("VotePanel", () => {
  it("mostra Culpado e Inocente e avisa qual foi escolhido", async () => {
    const onVote = vi.fn();
    render(<VotePanel hasVoted={false} onVote={onVote} />);

    await userEvent.click(screen.getByRole("button", { name: "Culpado" }));
    await userEvent.click(screen.getByRole("button", { name: "Inocente" }));

    expect(onVote.mock.calls).toEqual([["CULPADO"], ["INOCENTE"]]);
  });

  it("trava os botões enquanto o voto é enviado", () => {
    render(<VotePanel hasVoted={false} busy onVote={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Culpado" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Inocente" })).toHaveProperty("disabled", true);
  });

  it("depois do voto só confirma, sem botões (o voto não muda)", () => {
    render(<VotePanel hasVoted myChoice="CULPADO" onVote={vi.fn()} />);

    expect(screen.getByText("Voto registrado!")).toBeTruthy();
    expect(screen.getByText("Culpado")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("mostra o erro do envio", () => {
    render(<VotePanel hasVoted={false} error="A votação desse gato já fechou." onVote={vi.fn()} />);

    expect(screen.getByRole("alert").textContent).toBe("A votação desse gato já fechou.");
  });
});
