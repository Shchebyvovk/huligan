const STEP_VALIDATORS = {
  login(payload, hasUserPool) {
    if (!hasUserPool && (!payload?.email || !payload?.password))
      throw new Error("login: payload must have email and password (or define users pool)");
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

const KNOWN_ACTIONS = Object.keys(STEP_VALIDATORS);

function parseSteps(steps, hasUserPool) {
  if (!Array.isArray(steps)) throw new Error("steps must be an array");
  if (steps.length === 0) throw new Error("steps must not be empty");

  return steps.map((step, i) => {
    if (!step.action) throw new Error(`Step ${i}: missing action`);
    if (!KNOWN_ACTIONS.includes(step.action))
      throw new Error(`Step ${i}: unknown action "${step.action}"`);

    STEP_VALIDATORS[step.action](step.payload, hasUserPool);

    return step.payload !== undefined
      ? { action: step.action, payload: step.payload }
      : { action: step.action };
  });
}

function parseUsers(users) {
  if (!Array.isArray(users) || users.length === 0)
    throw new Error("users must be a non-empty array");
  return users.map((u, i) => {
    if (!u.email || !u.password)
      throw new Error(`User ${i}: must have email and password`);
    return { email: u.email, password: u.password };
  });
}

// Повертає { steps, users? }
// Приймає масив (старий формат) або об'єкт { users, steps } (новий)
export function parseScenario(raw) {
  if (Array.isArray(raw)) {
    return { steps: parseSteps(raw, false) };
  }

  if (raw && typeof raw === "object") {
    if (!raw.steps) throw new Error("Scenario object must have steps");
    const users = raw.users ? parseUsers(raw.users) : undefined;
    return { steps: parseSteps(raw.steps, !!users), users };
  }

  throw new Error("Scenario must be an array or object with steps");
}
