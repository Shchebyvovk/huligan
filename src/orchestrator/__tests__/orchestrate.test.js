import { describe, it, expect, vi } from "vitest";
import { orchestrate } from "../orchestrate.js";

const makeWorker = (delay = 0) =>
  vi.fn().mockImplementation(() =>
    new Promise(res => setTimeout(() => res({ ok: true }), delay))
  );

describe("orchestrate", () => {
  it("запускає рівно concurrency воркерів для кожного юзера", async () => {
    const worker = makeWorker();
    const users = [1, 2, 3];
    await orchestrate({ users, concurrency: 3, worker });
    expect(worker).toHaveBeenCalledTimes(3);
    expect(worker).toHaveBeenCalledWith(1);
    expect(worker).toHaveBeenCalledWith(2);
    expect(worker).toHaveBeenCalledWith(3);
  });

  it("повертає результат для кожного юзера", async () => {
    const worker = makeWorker();
    const results = await orchestrate({ users: [1, 2], concurrency: 2, worker });
    expect(results).toHaveLength(2);
    expect(results.every(r => r.ok === true)).toBe(true);
  });

  it("не перевищує ліміт concurrency одночасних воркерів", async () => {
    let active = 0;
    let maxActive = 0;

    const worker = vi.fn().mockImplementation(() =>
      new Promise(res => {
        active++;
        maxActive = Math.max(maxActive, active);
        setTimeout(() => { active--; res({ ok: true }); }, 20);
      })
    );

    await orchestrate({ users: [1, 2, 3, 4, 5], concurrency: 2, worker });
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("збирає результати навіть якщо деякі воркери падають", async () => {
    const worker = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("crash"))
      .mockResolvedValueOnce({ ok: true });

    const results = await orchestrate({ users: [1, 2, 3], concurrency: 3, worker });
    expect(results).toHaveLength(3);
    expect(results[1]).toEqual({ ok: false, error: "crash" });
  });
});
