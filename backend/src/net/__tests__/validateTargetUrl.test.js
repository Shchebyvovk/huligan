import { describe, it, expect } from "vitest";
import { validateTargetUrl, isBlockedAddress } from "../validateTargetUrl.js";

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "0.0.0.0", "100.64.0.1", "192.0.2.1", "224.0.0.1", "255.255.255.255",
  ])("блокує приватну/внутрішню IPv4 %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34"])(
    "пропускає публічну IPv4 %s", (ip) => {
      expect(isBlockedAddress(ip)).toBe(false);
    }
  );

  it.each(["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1"])(
    "блокує приватну/внутрішню IPv6 %s", (ip) => {
      expect(isBlockedAddress(ip)).toBe(true);
    }
  );

  it("пропускає публічну IPv6", () => {
    expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false);
  });
});

describe("validateTargetUrl", () => {
  it("приймає публічний https-хост (IP-резолв через injected resolver)", async () => {
    const res = await validateTargetUrl("https://chat.example.com/path", {
      resolveHost: async () => ["93.184.216.34"],
    });
    expect(res.ok).toBe(true);
  });

  it("приймає публічний literal-IP напряму, без резолву", async () => {
    const res = await validateTargetUrl("http://8.8.8.8:3000/");
    expect(res.ok).toBe(true);
  });

  it("відхиляє non-http(s) протокол", async () => {
    const res = await validateTargetUrl("ftp://example.com");
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/http/i);
  });

  it("відхиляє некоректний URL", async () => {
    const res = await validateTargetUrl("not a url");
    expect(res.ok).toBe(false);
  });

  it("відхиляє localhost без резолву (SSRF на власний бекенд)", async () => {
    const res = await validateTargetUrl("http://localhost:5432/");
    expect(res.ok).toBe(false);
  });

  it("відхиляє literal приватний IP напряму", async () => {
    const res = await validateTargetUrl("http://127.0.0.1/admin");
    expect(res.ok).toBe(false);
  });

  it("відхиляє cloud metadata IP напряму", async () => {
    const res = await validateTargetUrl("http://169.254.169.254/latest/meta-data/");
    expect(res.ok).toBe(false);
  });

  it("відхиляє хост, що резолвиться у приватну адресу (DNS rebinding)", async () => {
    const res = await validateTargetUrl("https://sneaky.attacker.example/", {
      resolveHost: async () => ["10.0.0.5"],
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/приватн/i);
  });

  it("відхиляє, якщо хоча б одна з резолвлених адрес приватна", async () => {
    const res = await validateTargetUrl("https://multi.example/", {
      resolveHost: async () => ["93.184.216.34", "127.0.0.1"],
    });
    expect(res.ok).toBe(false);
  });

  it("відхиляє, якщо резолв кидає помилку (DNS failure -> fail closed)", async () => {
    const res = await validateTargetUrl("https://nxdomain.invalid/", {
      resolveHost: async () => { throw new Error("ENOTFOUND"); },
    });
    expect(res.ok).toBe(false);
  });
});
