import { describe, it, expect } from "vitest";
import { withRetry } from "@/lib/retry";
import { escapeIlike, sanitizeOrValue, safeIlikePattern } from "@/lib/search";
import { claimInsertSchema, evidenceInsertSchema, toIsoDate } from "@/lib/validation";

describe("withRetry", () => {
  it("returns on first success", async () => {
    expect(await withRetry(async () => 7, 3)).toBe(7);
  });

  it("retries then succeeds", async () => {
    let n = 0;
    const result = await withRetry(async () => {
      n += 1;
      if (n < 2) throw new Error("fail");
      return "ok";
    }, 3);
    expect(result).toBe("ok");
    expect(n).toBe(2);
  });

  it("throws after exhausting attempts", async () => {
    await expect(
      withRetry(async () => {
        throw new Error("always");
      }, 2),
    ).rejects.toThrow("always");
  });
});

describe("search sanitization", () => {
  it("escapes ILIKE wildcards", () => {
    expect(escapeIlike("100%_off")).toBe("100\\%\\_off");
  });

  it("strips or-filter punctuation", () => {
    expect(sanitizeOrValue("a,b(c)")).toBe("a b c");
  });

  it("builds a safe pattern", () => {
    expect(safeIlikePattern("foo,bar%")).toBe("foo bar\\%");
  });
});

describe("validation", () => {
  it("accepts a valid claim", () => {
    const parsed = claimInsertSchema.parse({
      title: "Test",
      content: "Body",
      label: "user_claim",
      status: "unsupported",
    });
    expect(parsed.label).toBe("user_claim");
  });

  it("rejects an invalid claim label", () => {
    expect(() =>
      claimInsertSchema.parse({
        title: "Test",
        content: "Body",
        label: "alleged",
        status: "unsupported",
      }),
    ).toThrow();
  });

  it("normalizes empty evidence url", () => {
    const parsed = evidenceInsertSchema.parse({
      title: "Doc",
      source_type: "news",
      author: null,
      excerpt: null,
      credibility: "secondary",
      url: "",
      published_date: "2020-01-02",
    });
    expect(parsed.url).toBeNull();
  });

  it("maps partial dates to ISO", () => {
    expect(toIsoDate("2020-06")).toBe("2020-06-01");
    expect(toIsoDate("2020")).toBe("2020-01-01");
    expect(toIsoDate("not-a-date")).toBeNull();
  });
});
