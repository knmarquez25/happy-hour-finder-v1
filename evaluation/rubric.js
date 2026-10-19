export function scoreOutputs(cases, outputs, gold, presentedSuitability) {
  const rows = cases.map((scenario) => {
    const returned = (outputs[scenario.id] || []).slice(0, 3);
    if (!Array.isArray(gold[scenario.id]))
      throw new Error(`Missing reviewed gold label: ${scenario.id}`);
    const suitable =
      returned.find(
        (id) =>
          gold[scenario.id].includes(id) &&
          (!presentedSuitability ||
            presentedSuitability[scenario.id]?.includes(id)),
      ) || null;
    const pass = scenario.negative ? returned.length === 0 : suitable !== null;
    return {
      id: scenario.id,
      label: scenario.label,
      negative: scenario.negative,
      returned,
      suitable,
      pass,
    };
  });
  const positive = rows.filter((row) => !row.negative);
  const negative = rows.filter((row) => row.negative);
  return {
    total: rows.length,
    passed: rows.filter((row) => row.pass).length,
    positiveTotal: positive.length,
    positivePassed: positive.filter((row) => row.pass).length,
    negativeTotal: negative.length,
    negativePassed: negative.filter((row) => row.pass).length,
    rows,
  };
}
