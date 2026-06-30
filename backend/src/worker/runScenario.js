const HANDLERS = {
  login:        (client, payload) => client.login(payload),
  send_message: (client, payload) => client.sendMessage(payload),
  wait:         (client, payload) => client.wait(payload),
  logout:       (client)         => client.logout(),
};

export async function runScenario(steps, client) {
  const results = [];

  for (const step of steps) {
    try {
      const ms = await HANDLERS[step.action](client, step.payload)
      results.push({ action: step.action, ok: true, ms: ms ?? 0 });
    } catch (err) {
      results.push({ action: step.action, ok: false, ms: 0, error: err.message });
      break;
    }
  }

  return results;
}
