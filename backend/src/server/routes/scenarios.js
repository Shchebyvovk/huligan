import { parseScenario } from "../../scenario/parseScenario.js";
import { assertSafeName } from "../../scenario/safeName.js";

export async function scenariosRoutes(app, { db }) {
  app.get("/scenarios", async (req, reply) => {
    const rows = await db.getScenarios();
    reply.send(rows.map(r => r.users
      ? { name: r.name, steps: r.steps, users: r.users }
      : { name: r.name, steps: r.steps }
    ));
  });

  app.post("/scenarios", async (req, reply) => {
    const { name, steps } = req.body ?? {};
    if (!name || !steps) {
      return reply.code(400).send({ message: "name і steps обов'язкові" });
    }
    try {
      assertSafeName(name);
      const parsed = parseScenario(steps);
      const saved = await db.upsertScenario({ name, steps: parsed.steps, users: parsed.users ?? null });
      reply.code(201).send(saved.users
        ? { name: saved.name, steps: saved.steps, users: saved.users }
        : { name: saved.name, steps: saved.steps }
      );
    } catch (err) {
      reply.code(400).send({ message: err.message });
    }
  });

  app.delete("/scenarios/:name", async (req, reply) => {
    try {
      assertSafeName(req.params.name);
      const deleted = await db.deleteScenarioByName(req.params.name);
      if (!deleted) return reply.code(404).send({ message: "Сценарій не знайдено" });
      reply.code(204).send();
    } catch (err) {
      reply.code(400).send({ message: err.message });
    }
  });
}
