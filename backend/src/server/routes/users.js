import { generateUsers } from '../../users/generateUsers.js'

export async function usersRoutes(app, { db }) {
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
