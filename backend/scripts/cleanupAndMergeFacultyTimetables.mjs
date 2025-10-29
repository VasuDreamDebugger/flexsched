import connectMongoDB from "../src/database/db.js";
import ClassTimetable from "../src/Models/ClassTimetable.js";
import FacultyTimetable from "../src/Models/FacultyTimetable.js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply") || args.includes("-a");

async function main() {
  await connectMongoDB();
  console.log("FacultyTimetable FULL REBUILD from ClassTimetable");
  console.log("Mode:", APPLY ? "APPLY" : "DRY RUN");

  if (APPLY) {
    // Delete all existing FacultyTimetable docs
    const del = await FacultyTimetable.deleteMany({});
    console.log(`Deleted ${del.deletedCount} FacultyTimetable documents.`);
  }

  // Gather all class timetable slots by faculty/year/semester
  const classDocs = await ClassTimetable.find({}).lean();
  const facultyMap = new Map();
  for (const cls of classDocs) {
    const ver = (cls.versions || []).find((v) => v.label === "updated") ||
      (cls.versions || []).find((v) => v.label === "default") || {
        timeSlots: [],
      };
    for (const s of ver.timeSlots || []) {
      if (!s.facultyId) continue;
      const key = `${String(s.facultyId)}||${cls.academicYear || ""}||${
        cls.semester || ""
      }`;
      if (!facultyMap.has(key)) facultyMap.set(key, []);
      // Ensure all required fields are present
      facultyMap.get(key).push({
        day: s.day,
        period: s.period ?? 0,
        subject: s.subject ?? "",
        branch: cls.branch ?? "",
        year: cls.year ?? "",
        section: cls.section ?? "",
        semester: cls.semester ?? "",
        room: s.room ?? "",
        isLab: s.isLab ?? false,
        isTheory: s.isTheory ?? false,
        facultyId: s.facultyId,
      });
    }
  }

  let total = 0;
  for (const [key, slots] of facultyMap.entries()) {
    const [facultyId, academicYear, semester] = key.split("||");
    if (!slots.length) continue;
    total++;
    if (APPLY) {
      const ft = new FacultyTimetable({
        facultyId,
        academicYear,
        semester,
        versions: [
          {
            label: "updated",
            timeSlots: slots,
            updatedAt: new Date(),
          },
        ],
        currentVersionLabel: "updated",
      });
      await ft.save();
      console.log(
        `Inserted FacultyTimetable for faculty ${facultyId} year ${academicYear} sem ${semester} with ${slots.length} slots.`
      );
    } else {
      console.log(
        `[DRY RUN] Would insert FacultyTimetable for faculty ${facultyId} year ${academicYear} sem ${semester} with ${slots.length} slots.`
      );
    }
  }
  console.log(`Total FacultyTimetable docs to insert: ${total}`);
  if (!APPLY)
    console.log("Dry-run complete. Re-run with --apply to persist changes.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
