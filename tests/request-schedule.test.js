import test from "node:test";
import assert from "node:assert/strict";
import {
  contradictsSchedule,
  requestedSchedule,
} from "../server/request-schedule.js";
test("Monday noon parses without assuming unspecified fields", () => {
  assert.deepEqual(requestedSchedule("happy hour in Downey noon on Monday"), {
    day: "Monday",
    time: "12:00",
  });
  assert.deepEqual(requestedSchedule("Downey happy hour"), {
    day: null,
    time: null,
  });
});
test("known afternoon windows cannot become noon leads", () => {
  assert.equal(
    contradictsSchedule(
      "Monday-Friday 3pm-6pm",
      "happy hour in Downey noon on Monday",
    ),
    true,
  );
  assert.equal(
    contradictsSchedule(
      "Monday-Friday 12pm-2pm & 5pm-7pm",
      "happy hour in Downey noon on Monday",
    ),
    false,
  );
  assert.equal(
    contradictsSchedule(
      "Tuesday-Friday 12pm-2pm",
      "happy hour in Downey noon on Monday",
    ),
    true,
  );
});
test("unknown and open-ended schedules are not invented into a contradiction", () => {
  for (const text of [
    null,
    "Monday-Friday 12–2 PM &5–7 PM",
    "Opening to5pm",
    "Monday all day;Tuesday-Friday3pm-6pm",
  ])
    assert.equal(
      contradictsSchedule(text, "happy hour in Downey noon on Monday"),
      false,
    );
});
test("overnight schedules keep the previous evening weekday", () => {
  assert.equal(contradictsSchedule("Monday 9pm-2am", "Tuesday1am"), false);
  assert.equal(contradictsSchedule("Monday 9pm-2am", "Monday1am"), true);
  assert.equal(contradictsSchedule("Monday 9pm-2am", "Tuesday noon"), true);
});

test("relative, range and alternative times remain unverified instead of becoming exact instants", () => {
  for (const query of [
    "Downey Monday before noon",
    "Downey Monday10am or noon",
    "Downey Monday10am–1pm",
    "Downey Monday between10am and1pm",
  ])
    assert.equal(contradictsSchedule("Monday10am-11am", query), false, query);
  assert.equal(
    contradictsSchedule("Monday1pm-2pm", "Downey Monday after noon"),
    false,
  );
});

test("an approximate budget does not disable an exact noon schedule check", () => {
  assert.equal(
    contradictsSchedule(
      "Monday-Friday3pm-6pm",
      "Downey Monday noon around $25",
    ),
    true,
  );
});
