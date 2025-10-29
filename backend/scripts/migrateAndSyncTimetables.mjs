import connectMongoDB from "../src/database/db.js";
import Timetable from "../src/Models/Timetable.js";
import ClassTimetable from "../src/Models/ClassTimetable.js";
import FacultyTimetable from "../src/Models/FacultyTimetable.js";

// Simple CLI flags: --apply to actually write changes, otherwise dry-run
// --force will rebuild faculty timetables purely from class timetables (destructive)
const args = process.argv.slice(2);
const APPLY = args.includes("--apply") || args.includes("-a");
const FORCE = args.includes("--force") || args.includes("-f");
const BATCH = 50;

async function main() {
  await connectMongoDB();

  console.log("Starting migration and sync of Timetables");
  console.log(
    "Mode:",
    APPLY ? "APPLY (will persist changes)" : "DRY RUN (no DB writes)"
  );

  // Step 1: Convert existing Timetable docs (legacy) to have versions if missing
  const legacyDocs = await Timetable.find({});
  console.log(
    `Found ${legacyDocs.length} Timetable documents (legacy) to inspect.`
  );

  for (const doc of legacyDocs) {
    const needsConversion =
      !Array.isArray(doc.versions) || doc.versions.length === 0;
    if (needsConversion) {
      console.log(
        `Doc ${doc._id} (facultyId=${doc.facultyId}) needs versioned conversion.`
      );
      if (APPLY) {
        doc.versions = doc.versions || [];
        doc.versions.push({
          label: "default",
          timeSlots: doc.timeSlots || [],
          updatedAt: doc.updatedAt || new Date(),
        });
        doc.currentVersionLabel = doc.currentVersionLabel || "default";
        doc.markModified && doc.markModified("versions");
        await doc.save();
        console.log(`Converted Timetable ${doc._id} to versioned format.`);
      }
    }
  }

  // Step 2: Iterate ClassTimetable docs and sync their 'updated' or 'default' versions to faculty timetables
  const classDocs = await ClassTimetable.find({}).lean();
  console.log(`Found ${classDocs.length} ClassTimetable documents to sync.`);

  let totalUpdates = 0;
  // If force mode, clear existing faculty timetable versions for target year/semester before rebuilding
  if (FORCE) {
    console.log(
      "Force mode enabled - will rebuild faculty timetables from class data (destructive)"
    );
    if (APPLY) {
      // Collect unique faculty/year/semester tuples from classDocs
      const toClear = new Set();
      for (const cls of classDocs) {
        const ver = (cls.versions || []).find((v) => v.label === "updated") ||
          (cls.versions || []).find((v) => v.label === "default") || {
            timeSlots: [],
          };
        for (const s of ver.timeSlots || []) {
          if (!s.facultyId) continue;
          const key = `${String(s.facultyId)}|${cls.academicYear || ""}|${
            cls.semester || ""
          }`;
          toClear.add(key);
        }
      }
      console.log(`Force clearing ${toClear.size} faculty timetable targets.`);
      for (const key of toClear) {
        const [facultyId, academicYear, semester] = key.split("|");
        // Remove versions on Timetable and FacultyTimetable so we can rebuild
        await Timetable.updateMany(
          {
            facultyId,
            academicYear: academicYear || undefined,
            semester: semester || undefined,
          },
          { $set: { versions: [], currentVersionLabel: "default" } }
        );
        await FacultyTimetable.updateMany(
          {
            facultyId,
            academicYear: academicYear || undefined,
            semester: semester || undefined,
          },
          { $set: { versions: [], currentVersionLabel: "default" } }
        );
      }
      console.log("Cleared existing versions for force rebuild.");
    } else {
      console.log(
        "Dry-run: would clear existing faculty timetable versions for force rebuild (use --apply to persist)."
      );
    }
  }
  for (const cls of classDocs) {
    const ver = (cls.versions || []).find((v) => v.label === "updated") ||
      (cls.versions || []).find((v) => v.label === "default") || {
        timeSlots: [],
      };
    const slots = ver.timeSlots || [];
    if (!slots.length) continue;

    // Group by faculty
    const byFaculty = new Map();
    for (const s of slots) {
      if (!s.facultyId) continue;
      const key = String(s.facultyId);
      if (!byFaculty.has(key)) byFaculty.set(key, []);
      byFaculty.get(key).push(s);
    }

    for (const [facultyId, facultySlots] of byFaculty.entries()) {
      totalUpdates++;
      console.log(
        `Class ${cls._id} -> updating faculty ${facultyId} with ${facultySlots.length} slots`
      );
      if (APPLY) {
        // Find or create Timetable for this faculty/semester/year
        let fdoc = await Timetable.findOne({
          facultyId,
          academicYear: cls.academicYear,
          semester: cls.semester,
        });
        if (!fdoc) {
          fdoc = new Timetable({
            facultyId,
            academicYear: cls.academicYear,
            semester: cls.semester,
            versions: [],
          });
        }

        fdoc.versions = fdoc.versions || [];
        const base = fdoc.versions.find(
          (v) => v.label === fdoc.currentVersionLabel
        ) ||
          fdoc.versions.find((v) => v.label === "default") || { timeSlots: [] };
        const baseSlots = JSON.parse(JSON.stringify(base.timeSlots || []));

        // Remove any existing slots that belong to this class (match branch/year/section) and conflict by day/period
        const cleaned = baseSlots.filter(
          (fs) =>
            !facultySlots.some(
              (ms) =>
                ms.day === fs.day &&
                ms.period === fs.period &&
                ms.branch === fs.branch &&
                ms.year === fs.year &&
                ms.section === fs.section
            )
        );

        // Build mapped slots from class slots (match FacultyTimetable schema)
        const mapped = facultySlots.map((s) => ({
          day: s.day,
          period: s.period,
          subject: s.subject,
          branch: cls.branch,
          year: cls.year,
          section: cls.section,
          semester: cls.semester,
          room: s.room,
          isLab: s.isLab,
          isTheory: s.isTheory,
        }));

        const merged = [...cleaned, ...mapped];

        fdoc.versions.push({
          label: "updated",
          timeSlots: merged,
          updatedAt: new Date(),
        });
        fdoc.currentVersionLabel = "updated";
        fdoc.markModified && fdoc.markModified("versions");
        await fdoc.save();
        console.log(`Updated Timetable for faculty ${facultyId}`);

        // Also ensure FacultyTimetable collection (if used) is consistent
        let ft = await FacultyTimetable.findOne({
          facultyId,
          academicYear: cls.academicYear,
          semester: cls.semester,
        });
        if (!ft) {
          ft = new FacultyTimetable({
            facultyId,
            academicYear: cls.academicYear,
            semester: cls.semester,
            versions: [],
          });
        }

        ft.versions = ft.versions || [];
        const ftBase = ft.versions.find(
          (v) => v.label === ft.currentVersionLabel
        ) ||
          ft.versions.find((v) => v.label === "default") || { timeSlots: [] };
        const ftBaseSlots = JSON.parse(JSON.stringify(ftBase.timeSlots || []));

        const ftCleaned = ftBaseSlots.filter(
          (fs) =>
            !mapped.some(
              (ms) =>
                ms.day === fs.day &&
                ms.period === fs.period &&
                ms.branch === fs.branch &&
                ms.year === fs.year &&
                ms.section === fs.section
            )
        );
        const ftMerged = [...ftCleaned, ...mapped];

        ft.versions.push({
          label: "updated",
          timeSlots: ftMerged,
          updatedAt: new Date(),
        });
        ft.currentVersionLabel = "updated";
        ft.markModified && ft.markModified("versions");
        await ft.save();
        console.log(
          `Updated FacultyTimetable collection for faculty ${facultyId}`
        );
      }
    }
  }

  console.log("Migration complete. Total faculty docs touched:", totalUpdates);
  if (!APPLY)
    console.log("DRY RUN complete. Re-run with --apply to persist changes.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
