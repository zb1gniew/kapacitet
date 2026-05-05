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

  it("uses message then title as fallback when detail is absent", async () => {
    const fromMessage = await parseProblemDetails(
      new Response(JSON.stringify({ message: "Something went wrong" }), {
        headers: { "content-type": "application/json" },
      }),
    );
    expect(fromMessage.message).toBe("Something went wrong");

    const fromTitle = await parseProblemDetails(
      new Response(JSON.stringify({ title: "Bad Request" }), {
        headers: { "content-type": "application/json" },
      }),
    );
    expect(fromTitle.message).toBe("Bad Request");
  });

  it("uses the errors key as the fallback for fieldErrors", async () => {
    const result = await parseProblemDetails(
      new Response(JSON.stringify({ errors: { name: ["Name is required"] } }), {
        headers: { "content-type": "application/json" },
      }),
    );
    expect(result.fieldErrors).toEqual({ name: ["Name is required"] });
  });

  it("returns the default message when both body and message fields are empty", async () => {
    const emptyBody = await parseProblemDetails(
      new Response("", { headers: { "content-type": "text/plain" } }),
    );
    expect(emptyBody.message).toBe("The request failed.");

    const noFields = await parseProblemDetails(
      new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
      }),
    );
    expect(noFields.message).toBe("The request failed.");
  });
});
