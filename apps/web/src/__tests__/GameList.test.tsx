import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameList } from "@/components/GameList";
import type { Game } from "@/lib/types";
import gamesJson from "../../data/scores.json";

const FIXTURES = gamesJson as unknown as Game[];

const noop = vi.fn();
const defaultProps = {
  onReset: noop,
  selectedId: null,
  onSelect: noop,
  totalFiltered: FIXTURES.length,
  totalGames: FIXTURES.length,
};

describe("GameList", () => {
  it("renders an article for each game", () => {
    render(<GameList games={FIXTURES} {...defaultProps} />);
    expect(screen.getAllByRole("article")).toHaveLength(FIXTURES.length);
  });

  it("shows rank numbers starting at 1", () => {
    render(<GameList games={FIXTURES} {...defaultProps} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("shows the empty state message when games array is empty", () => {
    render(<GameList games={[]} {...defaultProps} totalFiltered={0} />);
    expect(
      screen.getByText(/aucune partie ne passe ces filtres/i),
    ).toBeInTheDocument();
  });

  it("shows a reset button in the empty state", () => {
    render(<GameList games={[]} {...defaultProps} totalFiltered={0} />);
    expect(
      screen.getByRole("button", { name: /réinitialiser/i }),
    ).toBeInTheDocument();
  });

  it("calls onReset when the reset button is clicked in empty state", async () => {
    const onReset = vi.fn();
    render(
      <GameList
        games={[]}
        {...defaultProps}
        totalFiltered={0}
        onReset={onReset}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /réinitialiser/i }),
    );
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does not render the empty state when games are present", () => {
    render(<GameList games={FIXTURES} {...defaultProps} />);
    expect(
      screen.queryByText(/aucune partie ne passe ces filtres/i),
    ).not.toBeInTheDocument();
  });
});
