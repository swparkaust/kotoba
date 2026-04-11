import { renderHook } from "@testing-library/react";

let mockWsInstances: MockWebSocket[] = [];

class MockWebSocket {
  url: string;
  onopen: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  send = jest.fn();
  close = jest.fn();
  constructor(url: string) {
    this.url = url;
    mockWsInstances.push(this);
  }
}

(global as any).WebSocket = MockWebSocket;

const CABLE_URL = "ws://localhost:3001/cable";
process.env.NEXT_PUBLIC_CABLE_URL = CABLE_URL;

import { useActionCable } from "@/hooks/useActionCable";

beforeEach(() => {
  mockWsInstances = [];
  jest.clearAllMocks();
});

describe("useActionCable", () => {
  it("connects to NEXT_PUBLIC_CABLE_URL", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    expect(mockWsInstances.length).toBeGreaterThan(0);
    expect(mockWsInstances[0].url).toBe(CABLE_URL);
  });

  it("sends subscribe command on open", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    ws.onopen!({});

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({ channel: "TestChannel" }),
      })
    );
  });

  it("calls onReceived for data messages", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    ws.onmessage!({
      data: JSON.stringify({ message: { text: "hello" } }),
    });

    expect(onReceived).toHaveBeenCalledWith({ text: "hello" });
  });

  it("filters ping messages", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    ws.onmessage!({ data: JSON.stringify({ type: "ping" }) });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("filters welcome messages", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    ws.onmessage!({ data: JSON.stringify({ type: "welcome" }) });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("filters confirm_subscription messages", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    ws.onmessage!({
      data: JSON.stringify({ type: "confirm_subscription" }),
    });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("closes WebSocket on unmount", () => {
    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];
    unmount();

    expect(ws.close).toHaveBeenCalled();
  });

  it("schedules reconnect on close while mounted", () => {
    jest.useFakeTimers();
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    expect(mockWsInstances.length).toBe(1);

    // Simulate WebSocket close while component is still mounted
    ws.onclose!({} as any);

    // Advance past the 3000ms reconnect delay
    jest.advanceTimersByTime(3000);

    // A new WebSocket should have been created for reconnection
    expect(mockWsInstances.length).toBe(2);
    jest.useRealTimers();
  });

  it("does not reconnect on close after unmount", () => {
    jest.useFakeTimers();
    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];
    unmount();

    // Simulate WebSocket close after unmount
    ws.onclose!({} as any);

    jest.advanceTimersByTime(3000);

    // No reconnection should happen - only the original ws
    expect(mockWsInstances.length).toBe(1);
    jest.useRealTimers();
  });

  it("clears reconnect timer on unmount", () => {
    jest.useFakeTimers();
    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];

    // Trigger onclose to schedule a reconnect timer
    ws.onclose!({} as any);

    // Unmount before the timer fires
    unmount();

    // Advance past the reconnect delay
    jest.advanceTimersByTime(3000);

    // No new WebSocket should be created
    expect(mockWsInstances.length).toBe(1);
    jest.useRealTimers();
  });

  it("ignores unparseable messages in onmessage", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    // Send invalid JSON - should not throw
    ws.onmessage!({ data: "not valid json{{{" });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("does not process messages after unmount", () => {
    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];
    unmount();

    ws.onmessage!({
      data: JSON.stringify({ message: { text: "late" } }),
    });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("does not connect when NEXT_PUBLIC_CABLE_URL is unset", () => {
    const origUrl = process.env.NEXT_PUBLIC_CABLE_URL;
    delete process.env.NEXT_PUBLIC_CABLE_URL;

    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    // No WebSocket should have been created
    expect(mockWsInstances.length).toBe(0);

    process.env.NEXT_PUBLIC_CABLE_URL = origUrl;
  });

  it("ignores messages without a message field", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    // Send a data message that has no message field and is not a system type
    ws.onmessage!({
      data: JSON.stringify({ identifier: "{}", type: undefined }),
    });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("handles onerror without crashing", () => {
    const onReceived = jest.fn();
    renderHook(() => useActionCable("TestChannel", onReceived));

    const ws = mockWsInstances[0];
    // Trigger onerror - should not throw
    ws.onerror!({} as any);
  });

  it("handles close on unmounted ref in reconnect timer", () => {
    jest.useFakeTimers();
    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];

    ws.onclose!({} as any);
    unmount();

    jest.advanceTimersByTime(3000);

    expect(mockWsInstances.length).toBe(1);
    jest.useRealTimers();
  });

  it("reconnect timer fires with mountedRef false when clearTimeout is bypassed", () => {
    jest.useFakeTimers();
    const origClear = global.clearTimeout;
    global.clearTimeout = jest.fn();

    const onReceived = jest.fn();
    const { unmount } = renderHook(() =>
      useActionCable("TestChannel", onReceived)
    );

    const ws = mockWsInstances[0];
    ws.onclose!({} as any);
    unmount();

    jest.advanceTimersByTime(3000);

    expect(mockWsInstances.length).toBe(1);

    global.clearTimeout = origClear;
    jest.useRealTimers();
  });
});
