const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export function menuCoverageErrors(coverage, sources = []) {
  const errors = [];
  if (!coverage || typeof coverage !== "object" || Array.isArray(coverage))
    return ["Invalid menu coverage"];
  const { status, reviewedOn, sourceIds, scope, gaps } = coverage;
  if (!["complete", "partial", "unverified"].includes(status))
    errors.push("Invalid menu coverage status");
  if (reviewedOn !== null && !validDate(reviewedOn))
    errors.push("Invalid menu review date");
  if (typeof scope !== "string" || !scope.trim())
    errors.push("Missing menu review scope");
  if (
    !Array.isArray(sourceIds) ||
    new Set(sourceIds).size !== sourceIds.length ||
    sourceIds.some((id) => !sources.some((s) => s.id === id))
  )
    errors.push("Invalid menu coverage source references");
  if (
    !Array.isArray(gaps) ||
    gaps.some((g) => typeof g !== "string" || !g.trim())
  )
    errors.push("Invalid menu coverage gaps");
  if (status === "complete") {
    if (
      !validDate(reviewedOn) ||
      !sourceIds?.length ||
      !sourceIds.some((id) =>
        sources.some(
          (s) =>
            s.id === id &&
            s.type === "primary" &&
            validDate(s.reviewedOn) &&
            s.reviewedOn >= reviewedOn,
        ),
      )
    )
      errors.push("Complete menu lacks reviewed primary evidence");
    if (gaps?.length !== 0) errors.push("Complete menu has unresolved gaps");
  } else if (!gaps?.length)
    errors.push("Incomplete menu needs an explicit gap");
  if (status === "partial" && (!validDate(reviewedOn) || !sourceIds?.length))
    errors.push("Partial menu needs a dated source review");
  return errors;
}
