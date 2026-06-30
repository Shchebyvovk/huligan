import { scanScenarios } from "../../scenario/scanScenarios.js";
import { saveScenario } from "../../scenario/saveScenario.js";
import { deleteScenario } from "../../scenario/deleteScenario.js";

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

  app.delete("/scenarios/:name", async (req, reply) => {
    try {
      await deleteScenario(scenariosDir, req.params.name);
      reply.code(204).send();
    } catch (err) {
      reply.code(400).send({ message: err.message });
    }
  });
}
