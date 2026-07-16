import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationsBell } from "./NotificationsBell";

const markRead = vi.fn();
const markAllRead = vi.fn();

vi.mock("@/features/notifications/notificationsApi", async () => {
  const actual = await vi.importActual<typeof import("./notificationsApi")>("./notificationsApi");
  return {
    ...actual,
    useNotifications: () => ({
      notifications: [
        { id: "n1", type: "SIGNAL", title: "New gold signal", body: "XAUUSD BUY published", readAt: null, createdAt: new Date().toISOString() },
        { id: "n2", type: "BILLING", title: "Payment received", body: "Thanks for subscribing", readAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      ],
      unreadCount: 1,
      isLoading: false,
      markRead,
      markAllRead,
    }),
  };
});

describe("NotificationsBell", () => {
  it("shows the unread count badge", () => {
    render(<NotificationsBell />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("opens the dropdown and lists notifications on click", () => {
    render(<NotificationsBell />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("New gold signal")).toBeInTheDocument();
    expect(screen.getByText("Payment received")).toBeInTheDocument();
  });

  it("marks an unread notification as read when clicked", () => {
    render(<NotificationsBell />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("New gold signal"));
    expect(markRead).toHaveBeenCalledWith("n1");
  });

  it("calls markAllRead when 'Mark all read' is clicked", () => {
    render(<NotificationsBell />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText(/Mark all read/i));
    expect(markAllRead).toHaveBeenCalled();
  });
});
