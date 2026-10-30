/**
 * Providers that decode `tool_choice` into a plain string (Go gateways such as
 * CodeBuddy) reject the OpenAI object form before routing:
 *
 *   400 {"code":11101,"msg":"Unmarshal chat params failed with error: json:
 *        cannot unmarshal object into Go struct field Request.tool_choice of
 *        type string"}
 *
 * Verified against the live gateway: the scalar forms "required" and "none" are
 * accepted, and a single-tool request under "required" still calls that tool.
 *
 * Collapse the object form to the nearest scalar so a forced function choice
 * keeps its forcing semantics instead of being forwarded verbatim.
 *
 * @param {object} body outbound request body (mutated in place)
 * @returns {boolean} whether tool_choice was rewritten
 */
export function normalizeScalarToolChoice(body) {
  const choice = body?.tool_choice;
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) return false;

  const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
  if (!hasTools) {
    delete body.tool_choice;
  } else if (choice.type === "none") {
    body.tool_choice = "none";
  } else {
    body.tool_choice = "required";
  }
  return true;
}
