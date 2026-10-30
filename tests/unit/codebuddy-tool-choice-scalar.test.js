import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { normalizeScalarToolChoice } from "../../open-sse/utils/toolChoiceCompat.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

const TOOLS = [
  {
    type: "function",
    function: { name: "respond", parameters: { type: "object", properties: {} } },
  },
];
const FORCED = { type: "function", function: { name: "respond" } };

describe("codebuddy scalar tool_choice (#11101)", () => {
  it("collapses a forced function object to 'required'", () => {
    const body = { tools: TOOLS, tool_choice: FORCED };
    expect(normalizeScalarToolChoice(body)).toBe(true);
    expect(body.tool_choice).toBe("required");
  });

  it("preserves 'none' semantics", () => {
    const body = { tools: TOOLS, tool_choice: { type: "none" } };
    normalizeScalarToolChoice(body);
    expect(body.tool_choice).toBe("none");
  });

  it("drops an object choice when the request carries no tools", () => {
    const body = { tools: [], tool_choice: FORCED };
    normalizeScalarToolChoice(body);
    expect(body.tool_choice).toBeUndefined();
  });

  it("leaves scalar choices untouched", () => {
    for (const scalar of ["auto", "required", "none"]) {
      const body = { tools: TOOLS, tool_choice: scalar };
      expect(normalizeScalarToolChoice(body)).toBe(false);
      expect(body.tool_choice).toBe(scalar);
    }
  });

  it("is a no-op when tool_choice is absent", () => {
    const body = { tools: TOOLS };
    expect(normalizeScalarToolChoice(body)).toBe(false);
    expect(body).not.toHaveProperty("tool_choice");
  });

  it("is wired into both codebuddy executors", () => {
    for (const name of ["codebuddy-intl.js", "codebuddy-cn.js"]) {
      const src = readFileSync(resolve(root, "open-sse/executors", name), "utf8");
      expect(src).toContain("normalizeScalarToolChoice(transformed)");
    }
  });
});
