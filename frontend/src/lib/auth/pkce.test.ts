import { describe, expect, it } from "vitest";
import {
  createCodeChallenge,
  createCodeVerifier,
  createRandomState,
} from "./pkce";

describe("pkce helpers", () => {
  it("creates URL-safe random state and code verifier values", () => {
    const state = createRandomState();
    const verifier = createCodeVerifier();

    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(state).not.toEqual(createRandomState());
    expect(verifier.length).toBeGreaterThan(state.length);
  });

  it("creates the RFC-compliant S256 code challenge", () => {
    expect(createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});
