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

const CABLE_URL = "ws://localhost:3000/cable";
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
});
