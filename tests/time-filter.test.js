import test from "node:test";
import assert from "node:assert/strict";
import { emptyPreferences, discover } from "../src/discovery.js";
import { interpretRequest } from "../server/ai.js";
import { contradictsSchedule } from "../server/request-schedule.js";
const venue = {
  id: "fixture",
  name: "Fixture",
  neighborhood: "Glendale",
  address: "1 Main St, Glendale, CA",
  sources: [{ id: "s", type: "primary", reviewedOn: "2026-10-26" }],
  menu: [],
  hours: [
    {
      id: "w",
      days: ["Monday"],
      start: "15:00",
      end: "18:00",
      sourceId: "s",
      status: "primary",
    },
  ],
};
test("night filters by overlap with 6pm-midnight, not any Monday offer", () => {
  const p = { ...emptyPreferences(), day: "Monday", timePeriod: "night" };
  assert.equal(discover([venue], p).length, 0);
  assert.equal(
    discover([{ ...venue, hours: [{ ...venue.hours[0], end: "18:30" }] }], p)
      .length,
    1,
  );
  assert.equal(
    discover(
      [
        {
          ...venue,
          hours: [{ ...venue.hours[0], start: "22:00", end: "02:00" }],
        },
      ],
      p,
    ).length,
    1,
  );
});
test("explicit exact time wins and unknown periods are rejected", () => {
  assert.equal(
    discover([venue], {
      ...emptyPreferences(),
      day: "Monday",
      time: "16:00",
      timePeriod: "night",
    }).length,
    1,
  );
  assert.throws(() =>
    discover([venue], { ...emptyPreferences(), timePeriod: "random" }),
  );
});
test("Monday night is retained even if the AI returns no exact clock", async () => {
  const prefs = await interpretRequest("glendale monday night", {
    apiKey: "test",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    ...emptyPreferences(),
                    area: "Glendale",
                    day: "Monday",
                  }),
                },
              ],
            },
          },
        ],
      }),
    }),
  });
  assert.equal(prefs.timePeriod, "night");
});
test("unverified schedule filters support shorthand meridiems and preserve unknowns", () => {
  assert.equal(
    contradictsSchedule(
      "Monday-Friday 12–2 PM & 5–7 PM",
      "Downey noon on Monday",
    ),
    false,
  );
  assert.equal(
    contradictsSchedule(
      "Monday-Friday 12–2 PM & 5–7 PM",
      "Downey 3pm on Monday",
    ),
    true,
  );
  assert.equal(
    contradictsSchedule("Monday 3pm–6pm", "glendale monday night"),
    true,
  );
  assert.equal(
    contradictsSchedule("Monday 5pm–8pm", "glendale monday night"),
    false,
  );
  assert.equal(
    contradictsSchedule("Tuesday 5pm–8pm", "glendale monday night"),
    true,
  );
  assert.equal(contradictsSchedule(null, "glendale monday night"), false);
});

test("literal night cannot be replaced by an invented AI clock", async () => {
  const p = await interpretRequest("Glendale Monday night", {
    apiKey: "test",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    ...emptyPreferences(),
                    area: "Glendale",
                    day: "Monday",
                    time: "16:00",
                  }),
                },
              ],
            },
          },
        ],
      }),
    }),
  });
  assert.equal(p.time, null);
  assert.equal(p.timePeriod, "night");
});
test("manual day overrides remove abbreviated weekdays too", async () => {
  const { applyTimeFilters } = await import("../src/time-filter.js");
  assert.equal(
    applyTimeFilters("Glendale Mon afternoon", {
      day: "Tuesday",
      timePeriod: "night",
      time: null,
    }),
    "Glendale Tuesday night",
  );
});

test("manual controls override AI fields, including an explicit Any day/time", async () => {
  const { overrideTimePreferences } = await import("../src/time-filter.js");
  const p = { ...emptyPreferences(), day: "Tuesday", time: "16:00" };
  assert.deepEqual(
    overrideTimePreferences(p, {
      day: "Monday",
      time: null,
      timePeriod: "night",
    }),
    { ...p, day: "Monday", time: null, timePeriod: "night" },
  );
  assert.deepEqual(
    overrideTimePreferences(p, { day: null, timePeriod: null }),
    { ...p, day: null, time: null, timePeriod: null },
  );
});
