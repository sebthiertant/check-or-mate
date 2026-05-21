import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPanel } from "@/components/FilterPanel";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { DIMENSION_LABELS } from "@/lib/types";

const noop = vi.fn();

describe("FilterPanel", () => {
  it("renders a labeled slider for each dimension", () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={noop}
        onReset={noop}
        hasActive={false}
      />,
    );
    for (const label of Object.values(DIMENSION_LABELS)) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("renders 7 range inputs", () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={noop}
        onReset={noop}
        hasActive={false}
      />,
    );
    expect(screen.getAllByRole("slider")).toHaveLength(7);
  });

  it("shows the Reset button when hasActive is true", () => {
    render(
      <FilterPanel
        filters={{ ...DEFAULT_FILTERS, sacrifice: 50 }}
        onUpdate={noop}
        onReset={noop}
        hasActive={true}
      />,
    );
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("hides the Reset button when hasActive is false", () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={noop}
        onReset={noop}
        hasActive={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onReset when Reset is clicked", async () => {
    const onReset = vi.fn();
    render(
      <FilterPanel
        filters={{ ...DEFAULT_FILTERS, sacrifice: 50 }}
        onUpdate={noop}
        onReset={onReset}
        hasActive={true}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("renders the Copy link button", () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={noop}
        onReset={noop}
        hasActive={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /copy link/i }),
    ).toBeInTheDocument();
  });

  it("renders the sort selector", () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={noop}
        onReset={noop}
        hasActive={false}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: /sort by/i }),
    ).toBeInTheDocument();
  });

  it("calls onUpdate when sort changes", async () => {
    const onUpdate = vi.fn();
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onUpdate={onUpdate}
        onReset={noop}
        hasActive={false}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /sort by/i }),
      "sacrifice",
    );
    expect(onUpdate).toHaveBeenCalledWith({ sort: "sacrifice" });
  });
});
