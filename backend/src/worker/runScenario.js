const HANDLERS = {
  login:        (client, payload) => client.login(payload),
  send_message: (client, payload) => client.sendMessage(payload),
  wait:         (client, payload) => client.wait(payload),
  logout:       (client)         => client.logout(),
};

// user = { email, password } з пулу юзерів (може бути undefined для старого формату)
export async function runScenario(steps, client, user) {
  const results = [];

  for (const step of steps) {
    try {
      // login без payload бере credentials з пулу
      const payload = (step.action === 'login' && !step.payload && user)
        ? user
        : step.payload;

      const ms = await HANDLERS[step.action](client, payload);
      results.push({ action: step.action, ok: true, ms: ms ?? 0 });
    } catch (err) {
      results.push({ action: step.action, ok: false, ms: 0, error: err.message });
      break;
    }
  }

  return results;
}
