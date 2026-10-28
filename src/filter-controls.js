import { timePeriods } from "./time-filter.js";
import { areaOptions, emptyPreferences } from "./discovery.js";
import { filterOptions } from "./filter-options.js";
import { escapeHtml as esc } from "./ui-state.js";

export function initFilters({ getVenues, onChange, onDraftChange }) {
  const fields = Object.fromEntries(
    ["city", "food", "drink", "budget", "day", "period", "time"].map((key) => [
      key,
      document.querySelector(`#filter-${key}`),
    ]),
  );
  const notice = document.querySelector("#filter-notice");
  const editingSearch = new Set();
  let current = emptyPreferences(),
    timeOverrides = {};
  const copy = (value) => ({
    ...value,
    foodPreferences: [...value.foodPreferences],
    drinkPreferences: [...value.drinkPreferences],
  });
  function suggestions() {
    const venues = getVenues();
    document.querySelector("#city-options").innerHTML = areaOptions(venues)
      .map((area) => `<option value="${esc(area)}"></option>`)
      .join("");
    for (const [kind, key] of [
      ["food", "foodPreferences"],
      ["drink", "drinkPreferences"],
    ]) {
      document.querySelector(`#${kind}-options`).innerHTML = filterOptions(
        venues,
        kind,
        current,
      )
        .map(
          (option) =>
            `<option value="${esc(option.label)}" label="${option.count} researched ${option.count === 1 ? "place" : "places"}"></option>`,
        )
        .join("");
    }
  }
  function chips() {
    const selected = [];
    for (const [key, value] of [
      ["area", current.area],
      [
        "budget",
        current.budget === null
          ? null
          : `$${current.budget} food + drink target`,
      ],
      ["day", current.day],
      ["time", current.time],
      ["timePeriod", timePeriods[current.timePeriod]?.label],
      ["atmosphere", current.atmosphere],
    ])
      if (value) selected.push({ key, value });
    for (const key of ["foodPreferences", "drinkPreferences"])
      for (const value of current[key]) selected.push({ key, value });
    document.querySelector("#filter-chips").innerHTML = selected
      .map(
        ({ key, value }) =>
          `<button type="button" class="filter-chip" data-filter-key="${key}" data-filter-value="${esc(value)}" aria-label="Remove ${key === "foodPreferences" ? "food" : key === "drinkPreferences" ? "drink" : key} filter: ${esc(value)}">${esc(value)} <span aria-hidden="true">×</span></button>`,
      )
      .join("");
    document.querySelector("#filter-count").textContent = selected.length
      ? `${selected.length} selected`
      : "Make it your kind of evening";
    document.querySelector("#clear-request").hidden = !selected.length;
  }
  function sync(value, refresh = true) {
    current = copy(value);
    editingSearch.clear();
    fields.city.value = current.area || "";
    fields.food.value = current.foodPreferences.join(" + ");
    fields.drink.value = current.drinkPreferences.join(" + ");
    if (
      current.budget !== null &&
      ![...fields.budget.options].some(
        (o) => o.value === String(current.budget),
      )
    ) {
      fields.budget.add(
        new Option(`Around $${current.budget}`, String(current.budget)),
      );
    }
    fields.budget.value = current.budget === null ? "" : String(current.budget);
    fields.day.value = current.day || "";
    fields.time.value = current.time || "";
    fields.period.value = current.time ? "exact" : current.timePeriod || "";
    document.querySelector(".exact-time").hidden =
      fields.period.value !== "exact";
    fields.city.removeAttribute("aria-invalid");
    notice.textContent = "";
    chips();
    if (refresh) suggestions();
  }
  function commit(key) {
    onDraftChange();
    const next = copy(current),
      value = fields[key].value.trim();
    if (key === "city") {
      const exact = areaOptions(getVenues()).find(
        (area) => area.toLowerCase() === value.toLowerCase(),
      );
      if (value && !exact) {
        fields.city.setAttribute("aria-invalid", "true");
        document.querySelector("#find-online").disabled = true;
        notice.textContent =
          "Choose a city or neighborhood from the suggestions, or clear City to browse anywhere.";
        return;
      }
      fields.city.removeAttribute("aria-invalid");
      notice.textContent = "";
      next.area = exact || null;
    }
    if (key === "food" || key === "drink")
      next[key === "food" ? "foodPreferences" : "drinkPreferences"] = value
        ? [value.toLowerCase()]
        : [];
    if (key === "budget") next.budget = value ? Number(value) : null;
    if (key === "day") {
      next.day = value || null;
      timeOverrides.day = next.day;
    }
    if (key === "period") {
      next.time = null;
      next.timePeriod = value && value !== "exact" ? value : null;
      fields.time.value = "";
      document.querySelector(".exact-time").hidden = value !== "exact";
      timeOverrides.time = null;
      timeOverrides.timePeriod = next.timePeriod;
    }
    if (key === "time") {
      next.time = value || null;
      next.timePeriod = null;
      timeOverrides.time = next.time;
      timeOverrides.timePeriod = null;
    }
    next.clarification = null;
    current = next;
    chips();
    suggestions();
    onChange(copy(next));
  }
  for (const [key, field] of Object.entries(fields))
    field.addEventListener(
      key === "city" || key === "food" || key === "drink" ? "input" : "change",
      () => {
        if (key === "city" || key === "food" || key === "drink")
          editingSearch.add(key);
        commit(key);
      },
    );
  for (const key of ["city", "food", "drink"]) {
    const field = fields[key];
    const selectedValue = () =>
      key === "city"
        ? current.area || ""
        : current[key === "food" ? "foodPreferences" : "drinkPreferences"].join(
            " + ",
          );
    // Native datalists filter against the input text. Start a fresh search
    // when reopening a selection, without changing the applied preferences.
    const reopen = () => {
      if (
        field.value.toLowerCase() === selectedValue().toLowerCase() &&
        (!editingSearch.has(key) ||
          [...field.list.options].some(
            (option) =>
              option.value.toLowerCase() === field.value.toLowerCase(),
          ))
      )
        field.value = "";
    };
    field.addEventListener("focus", reopen);
    field.addEventListener("pointerdown", reopen);
    field.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") reopen();
      if (
        (event.key === "Backspace" || event.key === "Delete") &&
        !field.value &&
        selectedValue()
      )
        commit(key);
    });
    field.addEventListener("blur", () => {
      if (!field.value) field.value = selectedValue();
      editingSearch.delete(key);
    });
  }
  document.querySelector("#filter-chips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-key]");
    if (!button) return;
    onDraftChange();
    const next = copy(current),
      key = button.dataset.filterKey;
    next[key] = Array.isArray(next[key])
      ? next[key].filter((value) => value !== button.dataset.filterValue)
      : null;
    if (key === "day") timeOverrides.day = null;
    if (key === "time" || key === "timePeriod") {
      timeOverrides.time = null;
      timeOverrides.timePeriod = null;
    }
    sync(next);
    onChange(copy(next));
    const field =
      fields[
        { area: "city", foodPreferences: "food", drinkPreferences: "drink" }[
          key
        ] || key
      ];
    (document.querySelector("#explore-filters").open && field
      ? field
      : document.querySelector("#explore-filters > summary")
    ).focus();
  });
  const panel = document.querySelector("#explore-filters"),
    narrow = matchMedia("(max-width: 480px)");
  panel.open = !narrow.matches;
  narrow.addEventListener("change", (event) => {
    panel.open = !event.matches;
  });
  return {
    sync,
    refresh: suggestions,
    getTimeOverrides: () => ({ ...timeOverrides }),
    clearTimeOverrides() {
      timeOverrides = {};
    },
  };
}
