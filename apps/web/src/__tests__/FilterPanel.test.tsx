import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPanel } from "@/components/FilterPanel";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { DIMENSION_LABELS } from "@/lib/types";

const noop = vi.fn();
const defaultProps = {
  filters: DEFAULT_FILTERS,
  onUpdate: noop,
  onReset: noop,
  isOpen: true,
  onClose: noop,
  topPlayers: [],
};

describe("FilterPanel", () => {
  it("renders a labeled slider for each dimension", () => {
    render(<FilterPanel {...defaultProps} />);
    for (const label of Object.values(DIMENSION_LABELS)) {
      expect(screen.getByLabelText(`Seuil minimum ${label}`)).toBeInTheDocument();
    }
  });

  it("renders 7 range inputs", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getAllByRole("slider")).toHaveLength(7);
  });

  it("shows the Réinitialiser button", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });

  it("calls onReset when Réinitialiser is clicked", async () => {
    const onReset = vi.fn();
    render(<FilterPanel {...defaultProps} onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("shows time control buttons", () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /toutes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bullet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /blitz/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rapid/i })).toBeInTheDocument();
  });

  it("calls onUpdate with timeControl when a cadence button is clicked", async () => {
    const onUpdate = vi.fn();
    render(<FilterPanel {...defaultProps} onUpdate={onUpdate} />);
    await userEvent.click(screen.getByRole("button", { name: /blitz/i }));
    expect(onUpdate).toHaveBeenCalledWith({ timeControl: "Blitz" });
  });
});
