import { describe, expect, it } from "vitest";
import { hashPassword } from "./crypto";

describe("hashPassword", () => {
  it("returns a string", () => {
    const password = "testPassword123";
    const salt = "testSalt";

    const result = hashPassword(password, salt);

    expect(typeof result).toBe("string");
    expect(result).toBeTruthy();
  });

  it("returns the same string when called with same parameters", () => {
    const password = "testPassword123";
    const salt = "testSalt";

    const result1 = hashPassword(password, salt);
    const result2 = hashPassword(password, salt);

    expect(result1).toBe(result2);
  });

  it("returns different strings for different passwords", () => {
    const salt = "testSalt";

    const result1 = hashPassword("password1", salt);
    const result2 = hashPassword("password2", salt);

    expect(result1).not.toBe(result2);
  });

  it("returns different strings for different salts", () => {
    const password = "testPassword123";

    const result1 = hashPassword(password, "salt1");
    const result2 = hashPassword(password, "salt2");

    expect(result1).not.toBe(result2);
  });

  it("returns a hex string of expected length", () => {
    const password = "testPassword123";
    const salt = "testSalt";

    const result = hashPassword(password, salt);

    // PBKDF2 with 64 bytes should produce 128 hex characters
    expect(result).toMatch(/^[a-f0-9]{128}$/);
    expect(result.length).toBe(128);
  });
});
