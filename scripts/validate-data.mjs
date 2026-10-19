import { restaurants, dataMetadata } from "../src/data.js";
import { validateRecords } from "../src/validation.js";
const errors = validateRecords(restaurants);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Valid: ${restaurants.length} venue records; ${dataMetadata.located} geocoded; ${dataMetadata.primaryHours} primary-supported schedules; ${dataMetadata.primaryFoodAndDrink} with priced primary-source food and drinks.`,
  );
