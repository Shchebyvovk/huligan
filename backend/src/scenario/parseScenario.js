const VALIDATORS = {
  login(payload) {
    if (!payload?.email || !payload?.password)
      throw new Error("login: payload must have email and password");
  },
  send_message(payload) {
    if (!payload?.text)
      throw new Error("send_message: payload must have text");
  },
  wait(payload) {
    if (typeof payload?.ms !== "number")
      throw new Error("wait: payload.ms must be a number");
  },
  logout() {},
};

const KNOWN_ACTIONS = Object.keys(VALIDATORS);

export function parseScenario(raw) {
  if (!Array.isArray(raw)) throw new Error("Scenario must be an array");
  if (raw.length === 0) throw new Error("Scenario must not be empty");

  return raw.map((step, i) => {
    if (!step.action) throw new Error(`Step ${i}: missing action`);
    if (!KNOWN_ACTIONS.includes(step.action))
      throw new Error(`Step ${i}: unknown action "${step.action}"`);

    VALIDATORS[step.action](step.payload);

    return step.payload !== undefined
      ? { action: step.action, payload: step.payload }
      : { action: step.action };
  });
}
