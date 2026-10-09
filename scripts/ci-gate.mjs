export const mandatoryJobs = ["validate-foundation"];

export function requireSuccess(needs) {
  if (!needs || typeof needs !== "object" || Array.isArray(needs)) throw new Error("Missing dependency results");
  const names = Object.keys(needs).sort();
  if (JSON.stringify(names) !== JSON.stringify([...mandatoryJobs].sort())) {
    throw new Error("Missing or unexpected mandatory dependency");
  }
  for (const name of mandatoryJobs) {
    if (needs[name]?.result !== "success") throw new Error(`${name} did not succeed`);
  }
}

if (import.meta.main) {
  try {
    requireSuccess(JSON.parse(process.env.NEEDS_JSON ?? "null"));
    console.log("Every mandatory validation succeeded.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
