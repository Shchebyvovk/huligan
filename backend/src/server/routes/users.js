import { generateUsers } from '../../users/generateUsers.js'

export async function usersRoutes(app, { db }) {
  app.get('/users', async (req, reply) => {
    const { registeredIn, page = 1, limit = 50 } = req.query
    const result = await db.getUsers({ registeredIn, page: Number(page), limit: Number(limit) })
    reply.send(result)
  })

  app.get('/users/apps', async (req, reply) => {
    const apps = await db.getUserApps()
    reply.send(apps)
  })

  app.get('/users/stats', async (req, reply) => {
    const { targetUrl } = req.query
    if (!targetUrl) return reply.code(400).send({ message: 'targetUrl обов\'язковий' })
    const stats = await db.getUsersStats(targetUrl)
    reply.send(stats)
  })

  app.post('/users/generate', async (req, reply) => {
    const { count } = req.body ?? {}
    if (!count || count < 1 || count > 10000) {
      return reply.code(400).send({ message: 'count має бути від 1 до 10000' })
    }
    const users = generateUsers(count)
    await db.insertUsers(users)
    reply.code(201).send({ generated: count })
  })
}
