import seedAdmin from "./seedAdmin.js";
import seedSampleData from "./seedSampleData.js";
import inspect from "./inspectDb.js";
import createMissing from "./createMissingFacultyTimetables.js";

const run = async () => {
  await seedAdmin();
  await seedSampleData();
  await createMissing();
  await inspect();
  process.exit(0);
};

run();
