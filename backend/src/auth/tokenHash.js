import { createHash } from "node:crypto";

// Сесійні/invite-токени зберігались у БД у відкритому вигляді — DB-дамп/бекап
// чи будь-яке читання БД одразу давав робочі admin-сесії. SHA-256(token)
// зберігається замість сирого значення; порівняння — по хешу вхідного
// значення (незворотне, лише для WHERE-збігу). Сирий токен лишається у
// куці/посиланні клієнта, як і раніше.
export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
