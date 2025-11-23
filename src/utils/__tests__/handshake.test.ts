import {
  createHandshakeMessage,
  HANDSHAKE_REQUEST_TYPE,
  HANDSHAKE_RESPONSE_TYPE,
  isHandshakeMessage,
} from "../handshake";

describe("handshake utils", () => {
  it("creates a handshake message with the expected namespace marker", () => {
    const message = createHandshakeMessage(HANDSHAKE_REQUEST_TYPE);

    expect(message).toEqual({
      __iframeStorageHandshake: true,
      type: HANDSHAKE_REQUEST_TYPE,
    });
  });

  it("detects handshake messages regardless of type when not specified", () => {
    const request = createHandshakeMessage(HANDSHAKE_REQUEST_TYPE);
    const response = createHandshakeMessage(HANDSHAKE_RESPONSE_TYPE);

    expect(isHandshakeMessage(request)).toBe(true);
    expect(isHandshakeMessage(response)).toBe(true);
  });

  it("detects handshake messages only of the requested type when provided", () => {
    const request = createHandshakeMessage(HANDSHAKE_REQUEST_TYPE);
    const response = createHandshakeMessage(HANDSHAKE_RESPONSE_TYPE);

    expect(isHandshakeMessage(request, HANDSHAKE_REQUEST_TYPE)).toBe(true);
    expect(isHandshakeMessage(response, HANDSHAKE_REQUEST_TYPE)).toBe(false);
  });

  it("returns false when the payload is missing the handshake marker", () => {
    expect(isHandshakeMessage({})).toBe(false);
    expect(isHandshakeMessage(null)).toBe(false);
    expect(isHandshakeMessage("not-a-message")).toBe(false);
  });
});
