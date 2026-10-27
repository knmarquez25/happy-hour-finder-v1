import test from "node:test";
import assert from "node:assert/strict";
import { displayHours } from "../src/display-hours.js";

test("compact schedules group consecutive days and retain seating restrictions", () => {
  assert.equal(
    displayHours([
      {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        start: "15:00",
        end: "19:00",
        restriction: "bar-or-patio",
      },
    ]),
    "Mon–Fri · 3–7 pm (bar or patio)",
  );
});
test("compact schedules preserve gaps, overnight times, conditional and unknown restrictions", () => {
  assert.equal(
    displayHours([
      {
        days: ["Monday", "Wednesday", "Friday"],
        start: "21:30",
        end: "00:00",
        restriction: "conditional",
      },
      {
        days: ["Sunday"],
        start: "11:00",
        end: "14:00",
        restriction: "special seating",
      },
    ]),
    "Mon, Wed, Fri · 9:30 pm–12 am (conditional); Sun · 11 am–2 pm (special seating)",
  );
});
test("empty schedules stay empty and formatting does not mutate source days", () => {
  const days = ["Friday", "Monday", "Wednesday"];
  assert.equal(displayHours([]), "");
  assert.equal(
    displayHours([{ days, start: "16:00", end: "18:00", restriction: "none" }]),
    "Fri, Mon, Wed · 4–6 pm",
  );
  assert.deepEqual(days, ["Friday", "Monday", "Wednesday"]);
});
