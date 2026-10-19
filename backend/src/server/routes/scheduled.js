import { validateTargetUrl } from "../../net/validateTargetUrl.js";
import { MAX_CONCURRENCY } from "./limits.js";
import { requireRole } from "../../permissions/requireRole.js";

export function scheduledRoutes(app, { db, resolveHost }) {
  app.get('/scheduled', async (req, reply) => {
    reply.send(await db.getScheduledRuns())
  })

  // Планований/повторюваний запуск — та сама "генерує трафік" чутливість, що
  // POST /runs, навіть вища (repeatIntervalMs означає, що один запит заводить
  // ФЛУД, що повторюється сам по собі).
  app.post('/scheduled', { preHandler: requireRole('admin') }, async (req, reply) => {
    const { scenarioName, targetUrl, concurrency, rampUpMs, usersCount, scheduledAt, repeatIntervalMs, maxIterations } = req.body
    if (!scenarioName || !targetUrl || !scheduledAt) return reply.status(400).send({ message: 'scenarioName, targetUrl, scheduledAt required' })
    const effectiveConcurrency = concurrency ?? 1
    if (effectiveConcurrency < 1 || effectiveConcurrency > MAX_CONCURRENCY) {
      return reply.status(400).send({ message: `concurrency має бути від 1 до ${MAX_CONCURRENCY}` })
    }
    const targetCheck = await validateTargetUrl(targetUrl, { resolveHost })
    if (!targetCheck.ok) {
      return reply.status(400).send({ message: targetCheck.reason })
    }
    const run = await db.createScheduledRun({ scenarioName, targetUrl, concurrency: effectiveConcurrency, rampUpMs, usersCount, scheduledAt, repeatIntervalMs, maxIterations })
    reply.status(201).send(run)
  })

  app.delete('/scheduled/:id', { preHandler: requireRole('admin') }, async (req, reply) => {
    await db.deleteScheduledRun(Number(req.params.id))
    reply.send({ ok: true })
  })

  app.patch('/scheduled/:id/toggle', { preHandler: requireRole('admin') }, async (req, reply) => {
    await db.toggleScheduledRun(Number(req.params.id), req.body.active)
    reply.send({ ok: true })
  })
}
