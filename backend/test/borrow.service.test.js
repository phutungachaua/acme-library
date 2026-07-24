import test from "node:test";
import assert from "node:assert/strict";
import { dateOrdinal, daysLate, parseRequestedReturnDate } from "../src/services/borrow.service.js";

test("daysLate returns zero on the same Vietnam calendar day", () => assert.equal(daysLate("2026-07-13T15:00:00Z", "2026-07-13T01:00:00Z"), 0));
test("daysLate counts calendar days and never returns negative", () => {
  assert.equal(daysLate("2026-07-16", "2026-07-13"), 3);
  assert.equal(daysLate("2026-07-10", "2026-07-13"), 0);
});
test("requested return date defaults to three Vietnam calendar days", () => {
  const now = new Date("2026-07-22T03:00:00Z");
  const result = parseRequestedReturnDate(undefined, now);
  assert.equal((dateOrdinal(result) - dateOrdinal(now)) / 86400000, 3);
});
test("requested return date rejects today and dates over 90 days", () => {
  const now = new Date("2026-07-22T03:00:00Z");
  assert.throws(() => parseRequestedReturnDate("2026-07-22", now), /ngày mai/);
  assert.throws(() => parseRequestedReturnDate("2026-10-21", now), /90 ngày/);
});
