import { buildApp } from "./src/server/index.js";

// TODO: замінити на реальний PostgreSQL адаптер
const db = {
  async findAdminByEmail() { return null; },
  async createSession() {},
  async findSession() { return null; },
  async deleteSession() {},
  async getRuns() { return []; },
  async createRun(data) { return { id: Date.now(), ...data, status: "pending" }; },
};

const app = buildApp({ db });

app.listen({ port: process.env.PORT ?? 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`Server running at ${address}`);
});
