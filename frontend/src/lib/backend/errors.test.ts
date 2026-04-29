import { describe, expect, it } from "vitest";
import { parseProblemDetails } from "./errors";

describe("parseProblemDetails", () => {
  it("parses structured problem details payloads", async () => {
    const result = await parseProblemDetails(
      new Response(
        JSON.stringify({
          detail: "Validation failed.",
          fieldErrors: { email: ["Invalid email"] },
        }),
        {
          headers: { "content-type": "application/problem+json" },
        },
      ),
    );

    expect(result).toEqual({
      message: "Validation failed.",
      fieldErrors: { email: ["Invalid email"] },
    });
  });

  it("falls back to plain text for non-json responses", async () => {
    const result = await parseProblemDetails(
      new Response("Gateway unavailable", {
        headers: { "content-type": "text/plain" },
      }),
    );

    expect(result).toEqual({
      message: "Gateway unavailable",
      fieldErrors: {},
    });
  });
});
