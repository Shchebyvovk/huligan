import { scanScenarios } from "../../scenario/scanScenarios.js";
import { saveScenario } from "../../scenario/saveScenario.js";

export async function scenariosRoutes(app, { scenariosDir }) {
  app.get("/scenarios", async (req, reply) => {
    reply.send(await scanScenarios(scenariosDir));
  });

  app.post("/scenarios", async (req, reply) => {
    const { name, steps } = req.body ?? {};
    if (!name || !steps) {
      return reply.code(400).send({ message: "name і steps обов'язкові" });
    }
    try {
      const saved = await saveScenario(scenariosDir, name, steps);
      reply.code(201).send(saved);
    } catch (err) {
      reply.code(400).send({ message: err.message });
    }
  });
}
