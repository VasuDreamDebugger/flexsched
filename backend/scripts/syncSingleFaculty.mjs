import connectMongoDB from "../src/database/db.js";
import Timetable from "../src/Models/Timetable.js";
import FacultyTimetable from "../src/Models/FacultyTimetable.js";
import ClassTimetable from "../src/Models/ClassTimetable.js";

const args = process.argv.slice(2);
const facultyArgIndex = args.findIndex((a) => a === "--faculty" || a === "-f");
const APPLY = args.includes("--apply") || args.includes("-a");
const facultyId = facultyArgIndex !== -1 ? args[facultyArgIndex + 1] : null;
const academicYearIndex = args.findIndex((a) => a === "--academicYear");
const semesterIndex = args.findIndex((a) => a === "--semester");
const academicYear =
  academicYearIndex !== -1 ? args[academicYearIndex + 1] : null;
const semester = semesterIndex !== -1 ? args[semesterIndex + 1] : null;

if (!facultyId) {
  console.error(
    'Usage: node syncSingleFaculty.mjs --faculty <facultyId> [--academicYear "..."] [--semester "..."] [--apply]',
  );
  process.exit(1);
}

async function main() {
  await connectMongoDB();
  console.log("SYNC SINGLE FACULTY");
  console.log(
    "Faculty:",
    facultyId,
    "AcademicYear:",
    academicYear,
    "Semester:",
    semester,
    "Mode:",
    APPLY ? "APPLY" : "DRY RUN",
  );

  // Find class timetables that reference this faculty in any version
  const classDocs = await ClassTimetable.find({}).lean();
  const collectedSlots = [];

  for (const cls of classDocs) {
    const ver = (cls.versions || []).find((v) => v.label === "updated") ||
      (cls.versions || []).find((v) => v.label === "default") || {
        timeSlots: [],
      };
    for (const s of ver.timeSlots || []) {
      if (!s.facultyId) continue;
      if (String(s.facultyId) === String(facultyId)) {
        collectedSlots.push({
          classId: cls._id,
          branch: cls.branch,
          year: cls.year,
          section: cls.section,
          academicYear: cls.academicYear,
          semester: cls.semester,
          slot: s,
        });
      }
    }
  }

  console.log(
    `Found ${collectedSlots.length} slots in class timetables for faculty ${facultyId}`,
  );
  if (!collectedSlots.length) {
    console.log("No class slots reference this faculty. Nothing to sync.");
    process.exit(0);
  }

  // Group by academicYear+semester for updates
  const groupKey = (c) =>
    `${c.academicYear || academicYear || ""}||${c.semester || semester || ""}`;
  const byGroup = new Map();
  for (const c of collectedSlots) {
    const key = groupKey(c);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(c);
  }

  for (const [key, items] of byGroup.entries()) {
    const [ay, sem] = key.split("||");
    console.log(
      `Processing group academicYear='${ay}' semester='${sem}' with ${items.length} slots`,
    );

    const mapped = items.map((it) => ({
      day: it.slot.day,
      period: it.slot.period,
      subject: it.slot.subject,
      branch: it.branch,
      year: it.year,
      section: it.section,
      semester: it.semester,
      room: it.slot.room,
      isLab: it.slot.isLab,
      isTheory: it.slot.isTheory,
    }));

    // Load or create Timetable
    let tt = await Timetable.findOne({
      facultyId,
      academicYear: ay || academicYear,
      semester: sem || semester,
    });
    if (!tt) {
      console.log(
        "No Timetable doc found for faculty in this group; would create one.",
      );
      if (APPLY) {
        tt = new Timetable({
          facultyId,
          academicYear: ay || academicYear,
          semester: sem || semester,
          versions: [],
        });
      } else {
        tt = null;
      }
    }

    if (tt) {
      const base = (tt.versions || []).find(
        (v) => v.label === tt.currentVersionLabel,
      ) ||
        (tt.versions || []).find((v) => v.label === "default") || {
          timeSlots: [],
        };
      const baseSlots = JSON.parse(JSON.stringify(base.timeSlots || []));
      const cleaned = baseSlots.filter(
        (fs) =>
          !mapped.some(
            (ms) =>
              ms.day === fs.day &&
              Number(ms.period) === Number(fs.period) &&
              ms.branch === fs.branch &&
              ms.year === fs.year &&
              ms.section === fs.section,
          ),
      );
      const merged = [...cleaned, ...mapped];

      console.log(
        `Would set updated version with ${merged.length} slots for Timetable (faculty ${facultyId})`,
      );
      if (APPLY) {
        tt.versions = tt.versions || [];
        tt.versions.push({
          label: "updated",
          timeSlots: merged,
          updatedAt: new Date(),
        });
        tt.currentVersionLabel = "updated";
        tt.markModified && tt.markModified("versions");
        await tt.save();
        console.log("Saved Timetable updated version.");
      }
    } else {
      console.log(
        "Dry-run: would create Timetable with updated version including mapped slots.",
      );
    }

    // Also update FacultyTimetable collection
    let ft = await FacultyTimetable.findOne({
      facultyId,
      academicYear: ay || academicYear,
      semester: sem || semester,
    });
    if (!ft) {
      console.log(
        "No FacultyTimetable found for faculty in this group; would create one.",
      );
      if (APPLY) {
        ft = new FacultyTimetable({
          facultyId,
          academicYear: ay || academicYear,
          semester: sem || semester,
          versions: [],
        });
      } else {
        ft = null;
      }
    }

    if (ft) {
      const base = (ft.versions || []).find(
        (v) => v.label === ft.currentVersionLabel,
      ) ||
        (ft.versions || []).find((v) => v.label === "default") || {
          timeSlots: [],
        };
      const baseSlots = JSON.parse(JSON.stringify(base.timeSlots || []));
      const cleaned = baseSlots.filter(
        (fs) =>
          !mapped.some(
            (ms) =>
              ms.day === fs.day &&
              Number(ms.period) === Number(fs.period) &&
              ms.branch === fs.branch &&
              ms.year === fs.year &&
              ms.section === fs.section,
          ),
      );
      const merged = [...cleaned, ...mapped];

      console.log(
        `Would set updated version with ${merged.length} slots for FacultyTimetable (faculty ${facultyId})`,
      );
      if (APPLY) {
        ft.versions = ft.versions || [];
        ft.versions.push({
          label: "updated",
          timeSlots: merged,
          updatedAt: new Date(),
        });
        ft.currentVersionLabel = "updated";
        ft.markModified && ft.markModified("versions");
        await ft.save();
        console.log("Saved FacultyTimetable updated version.");
      }
    } else {
      console.log(
        "Dry-run: would create FacultyTimetable with updated version including mapped slots.",
      );
    }
  }

  console.log("Sync single faculty complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error in syncSingleFaculty:", err);
  process.exit(1);
});
