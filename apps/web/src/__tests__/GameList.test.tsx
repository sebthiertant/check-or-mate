import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameList } from "@/components/GameList";
import { FIXTURES } from "@/lib/fixtures";

const noop = vi.fn();

describe("GameList", () => {
  it("renders an article for each game", () => {
    render(<GameList games={FIXTURES} onReset={noop} />);
    expect(screen.getAllByRole("article")).toHaveLength(FIXTURES.length);
  });

  it("shows rank numbers starting at 1", () => {
    render(<GameList games={FIXTURES} onReset={noop} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("shows the empty state message when games array is empty", () => {
    render(<GameList games={[]} onReset={noop} />);
    expect(screen.getByText(/no games match/i)).toBeInTheDocument();
  });

  it("shows a reset button in the empty state", () => {
    render(<GameList games={[]} onReset={noop} />);
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls onReset when the reset button is clicked in empty state", async () => {
    const onReset = vi.fn();
    render(<GameList games={[]} onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does not render the empty state when games are present", () => {
    render(<GameList games={FIXTURES} onReset={noop} />);
    expect(screen.queryByText(/no games match/i)).not.toBeInTheDocument();
  });
});
