import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TermsModal from "../TermsModal";

vi.mock("@iconify/react", () => ({
  Icon: () => null,
}));

describe("TermsModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TermsModal isOpen={false} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(
      <TermsModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(screen.getByText("Syarat & Ketentuan")).toBeInTheDocument();
  });

  it("renders all 6 terms items", () => {
    render(
      <TermsModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />
    );
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`${i}.`)).toBeInTheDocument();
    }
  });

  it("confirm button is disabled when checkbox not checked", () => {
    render(
      <TermsModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />
    );
    const button = screen.getByText("Daftar Sekarang");
    expect(button).toBeDisabled();
  });

  it("confirm button is enabled after checking agreement", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TermsModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />
    );
    const checkbox = container.querySelector("label > div");
    expect(checkbox).not.toBeNull();
    if (checkbox) await user.click(checkbox);
    const button = screen.getByText("Daftar Sekarang");
    expect(button).toBeEnabled();
  });

  it("calls onConfirm when agreed and button clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { container } = render(
      <TermsModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />
    );
    const checkbox = container.querySelector("label > div");
    expect(checkbox).not.toBeNull();
    if (checkbox) await user.click(checkbox);
    await user.click(screen.getByText("Daftar Sekarang"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <TermsModal isOpen={true} onClose={onClose} onConfirm={() => {}} />
    );
    const closeBtn = screen.getByText("Syarat & Ketentuan")
      .closest("div")!
      .querySelector("button");
    if (closeBtn) {
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
