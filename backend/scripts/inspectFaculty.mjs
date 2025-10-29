import connectMongoDB from "../src/database/db.js";
import Timetable from "../src/Models/Timetable.js";
import FacultyTimetable from "../src/Models/FacultyTimetable.js";

const args = process.argv.slice(2);
const facultyId = args[0];
if (!facultyId) {
  console.error("Usage: node inspectFaculty.mjs <facultyId>");
  process.exit(1);
}

async function main() {
  await connectMongoDB();
  console.log("Inspecting faculty:", facultyId);
  const timetables = await Timetable.find({ facultyId }).lean();
  console.log("Timetable docs found:", timetables.length);
  for (const t of timetables) {
    console.log(
      "Timetable id:",
      t._id.toString(),
      "academicYear:",
      t.academicYear,
      "semester:",
      t.semester,
      "versions:",
      (t.versions || []).length
    );
    for (const v of t.versions || []) {
      console.log("  version", v.label, "slots:", (v.timeSlots || []).length);
    }
  }

  const fts = await FacultyTimetable.find({ facultyId }).lean();
  console.log("FacultyTimetable docs found:", fts.length);
  for (const f of fts) {
    console.log(
      "FacultyTimetable id:",
      f._id.toString(),
      "academicYear:",
      f.academicYear,
      "semester:",
      f.semester,
      "versions:",
      (f.versions || []).length,
      "current:",
      f.currentVersionLabel
    );
    for (const v of f.versions || []) {
      console.log("  version", v.label, "slots:", (v.timeSlots || []).length);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
