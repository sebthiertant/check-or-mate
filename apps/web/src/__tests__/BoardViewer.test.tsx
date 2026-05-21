import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardViewer } from "@/components/BoardViewer";

// react-chessboard uses browser APIs not available in jsdom — mock it.
vi.mock("react-chessboard", () => ({
  Chessboard: ({ position }: { position: string }) => (
    <div data-testid="chessboard" data-position={position} />
  ),
}));

const PGN = `[Event "Test"]
[White "A"]
[Black "B"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 1/2-1/2`;

describe("BoardViewer — PGN vide", () => {
  it("affiche quand même l'échiquier en position initiale", () => {
    render(<BoardViewer pgn="" gameId="test-123" />);
    expect(screen.getByTestId("chessboard")).toBeInTheDocument();
  });

  it("affiche le message données de démo", () => {
    render(<BoardViewer pgn="" gameId="test-123" />);
    expect(screen.getByText(/données de démo/i)).toBeInTheDocument();
  });

  it("n'affiche pas les boutons de navigation", () => {
    render(<BoardViewer pgn="" gameId="test-123" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lien vers chess.com pour un ID fictif", () => {
    render(<BoardViewer pgn="" gameId="nakamura-carlsen-2026-01" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.chess.com",
    );
  });

  it("lien vers la partie pour un ID numérique", () => {
    render(<BoardViewer pgn="" gameId="96543210" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.chess.com/game/live/96543210",
    );
  });
});

describe("BoardViewer — avec PGN", () => {
  it("affiche l'échiquier", () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    expect(screen.getByTestId("chessboard")).toBeInTheDocument();
  });

  it("affiche la position initiale par défaut", () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    expect(screen.getByText(/position initiale/i)).toBeInTheDocument();
  });

  it("désactive ◀◀ et ◀ au départ", () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    expect(screen.getByRole("button", { name: /début/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /précédent/i })).toBeDisabled();
  });

  it("passe au coup suivant sur ▶", async () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    await userEvent.click(screen.getByRole("button", { name: /suivant/i }));
    expect(screen.getByText(/1\. e4/i)).toBeInTheDocument();
  });

  it("saute à la fin sur ▶▶", async () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    await userEvent.click(screen.getByRole("button", { name: /fin/i }));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /fin/i })).toBeDisabled();
  });

  it("revient au début sur ◀◀ après navigation", async () => {
    render(<BoardViewer pgn={PGN} gameId="game-1" />);
    await userEvent.click(screen.getByRole("button", { name: /fin/i }));
    await userEvent.click(screen.getByRole("button", { name: /début/i }));
    expect(screen.getByText(/position initiale/i)).toBeInTheDocument();
  });

  it("inclut le lien Chess.com avec ID numérique", () => {
    render(<BoardViewer pgn={PGN} gameId="96543210" />);
    expect(screen.getByRole("link", { name: /chess\.com/i })).toHaveAttribute(
      "href",
      "https://www.chess.com/game/live/96543210",
    );
  });
});
