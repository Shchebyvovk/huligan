import { describe, it, expect, vi } from "vitest";
import { runJob } from "../runJob.js";

const STEPS = [{ action: "login" }, { action: "logout" }];

const makeDb = () => ({
  updateRunStatus: vi.fn().mockResolvedValue(undefined),
  updateRunProgress: vi.fn().mockResolvedValue(undefined),
});

const okClient = () => ({
  login: vi.fn().mockResolvedValue(50),
  sendMessage: vi.fn().mockResolvedValue(30),
  wait: vi.fn().mockResolvedValue(0),
  logout: vi.fn().mockResolvedValue(10),
});

describe("runJob", () => {
  it("переводить ран pending → running → completed якщо всі кроки ok", async () => {
    const db = makeDb();
    await runJob({ run: { id: 1, concurrency: 3 }, db, makeClient: okClient, steps: STEPS });

    expect(db.updateRunStatus).toHaveBeenNthCalledWith(1, 1, "running");
    expect(db.updateRunStatus).toHaveBeenNthCalledWith(2, 1, "completed", expect.objectContaining({
      total: 3, passed: 3, failed: 0,
    }));
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

    expect(db.updateRunStatus).toHaveBeenNthCalledWith(2, 1, "partial", expect.objectContaining({
      failed: 1,
    }));
  });

  it("обмежує паралелізм maxParallel", async () => {
    const db = makeDb();
    let active = 0;
    let maxActive = 0;
    const client = () => ({
      login: vi.fn().mockImplementation(() => new Promise(res => {
        active++;
        maxActive = Math.max(maxActive, active);
        setTimeout(() => { active--; res(10); }, 5);
      })),
      sendMessage: vi.fn().mockResolvedValue(10),
      wait: vi.fn().mockResolvedValue(0),
      logout: vi.fn().mockResolvedValue(10),
    });

    await runJob({ run: { id: 1, concurrency: 10 }, db, makeClient: client, steps: STEPS, maxParallel: 2 });
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
