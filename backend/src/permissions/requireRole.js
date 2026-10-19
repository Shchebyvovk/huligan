import { roleAtLeast } from "./roles.js";

// Fastify preHandler factory — застосовується ПІСЛЯ сесійного preHandler
// (index.js), який уже встановив req.role. 403 (не 401): сесія валідна,
// просто бракує рівня. Deny-by-default: req.role відсутній/невідомий ->
// roleAtLeast сама повертає false, тож і тут fail closed, не крашиться.
export function requireRole(minRole) {
  return async function requireRoleHandler(req, reply) {
    if (!roleAtLeast(req.role, minRole)) {
      return reply.code(403).send({ message: "Недостатньо прав" });
    }
  };
}
