import { describe, it, expect, vi } from "vitest";
import { runJob } from "../runJob.js";

const STEPS = [{ action: "login" }, { action: "logout" }];

const makeDb = () => ({
  updateRunStatus: vi.fn().mockResolvedValue(undefined),
});

const okClient = () => ({
  login: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  wait: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
});

describe("runJob", () => {
  it("переводить ран pending → running → completed якщо всі кроки ok", async () => {
    const db = makeDb();
    await runJob({ run: { id: 1, concurrency: 3 }, db, makeClient: okClient, steps: STEPS });

    expect(db.updateRunStatus).toHaveBeenNthCalledWith(1, 1, "running");
    expect(db.updateRunStatus).toHaveBeenNthCalledWith(2, 1, "completed");
  });

  it("переводить ран у failed якщо хоч один воркер впав", async () => {
    const db = makeDb();
    let call = 0;
    const flakyClient = () => {
      call++;
      const client = okClient();
      if (call === 2) client.login.mockRejectedValue(new Error("boom"));
      return client;
    };

    await runJob({ run: { id: 1, concurrency: 3 }, db, makeClient: flakyClient, steps: STEPS });

    expect(db.updateRunStatus).toHaveBeenNthCalledWith(2, 1, "failed");
  });

  it("обмежує паралелізм maxParallel", async () => {
    const db = makeDb();
    let active = 0;
    let maxActive = 0;
    const client = () => ({
      login: vi.fn().mockImplementation(() => new Promise(res => {
        active++;
        maxActive = Math.max(maxActive, active);
        setTimeout(() => { active--; res(); }, 5);
      })),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      wait: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    });

    await runJob({ run: { id: 1, concurrency: 10 }, db, makeClient: client, steps: STEPS, maxParallel: 2 });
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
