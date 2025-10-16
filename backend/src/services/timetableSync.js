import FacultyTimetable from "../Models/FacultyTimetable.js";
import ClassTimetable from "../Models/ClassTimetable.js";
import Timetable from "../Models/Timetable.js";

// Sync a class timetable version to faculty timetables (upsert per faculty/day/period)
export async function syncClassToFaculty(
  classTimetableDoc,
  versionLabel = "updated"
) {
  const version =
    (classTimetableDoc.versions || []).find((v) => v.label === versionLabel) ||
    (classTimetableDoc.versions || []).find((v) => v.label === "default");
  if (!version) return;
  const { academicYear, semester } = classTimetableDoc;

  // Group by facultyId
  const byFaculty = new Map();
  for (const slot of version.timeSlots) {
    const key = String(slot.facultyId);
    if (!byFaculty.has(key)) byFaculty.set(key, []);
    byFaculty.get(key).push(slot);
  }

  const ops = [];
  for (const [facultyId, slots] of byFaculty.entries()) {
    // Find existing faculty timetable doc (versioned) or create
    const doc =
      (await FacultyTimetable.findOne({ facultyId, academicYear, semester })) ||
      new FacultyTimetable({ facultyId, academicYear, semester, versions: [] });

    // Build mapped faculty slots for this class
    const mapped = slots.map((s) => ({
      day: s.day,
      period: s.period,
      subject: s.subject,
      branch: classTimetableDoc.branch,
      year: classTimetableDoc.year,
      section: classTimetableDoc.section,
      room: s.room,
      isLab: s.isLab,
      isTheory: s.isTheory,
    }));

    // Create a new 'updated' version by taking the latest (default or existing) and patching
    const base = (doc.versions || []).find(
      (v) => v.label === doc.currentVersionLabel
    ) ||
      (doc.versions || []).find((v) => v.label === "default") || {
        timeSlots: [],
      };
    // clone base slots
    const newSlots = JSON.parse(JSON.stringify(base.timeSlots || []));

    // remove any slots that belong to this class (same branch/year/section) and conflict by day/period
    const cleaned = newSlots.filter(
      (fs) =>
        !mapped.some(
          (m) =>
            m.day === fs.day &&
            m.period === fs.period &&
            m.branch === fs.branch &&
            m.year === fs.year &&
            m.section === fs.section
        )
    );

    // Merge mapped slots (replace any existing same day/period)
    const merged = [...cleaned];
    for (const ms of mapped) merged.push(ms);

    // push new version
    doc.versions.push({
      label: "updated",
      timeSlots: merged,
      updatedAt: new Date(),
    });
    doc.currentVersionLabel = "updated";

    doc.markModified("versions");
    ops.push(doc.save());
  }

  await Promise.all(ops);
}

// Sync a faculty timetable to class updated version for its class slots
export async function syncFacultyToClass(facultyTimetableDoc) {
  const { academicYear, semester } = facultyTimetableDoc;

  // Use faculty's current version label to get current slots
  const currentLabel = facultyTimetableDoc.currentVersionLabel || "default";
  const currentVersion = (facultyTimetableDoc.versions || []).find(
    (v) => v.label === currentLabel
  ) || { timeSlots: [] };

  // Group faculty slots by class identity
  const byClass = new Map();
  for (const s of currentVersion.timeSlots || []) {
    const key = `${s.branch}|${s.year}|${s.section}`;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key).push(s);
  }

  const ops = [];
  for (const [key, slots] of byClass.entries()) {
    const [branch, year, section] = key.split("|");
    const classDoc =
      (await ClassTimetable.findOne({
        branch,
        year,
        section,
        academicYear,
        semester,
      })) ||
      new ClassTimetable({
        branch,
        year,
        section,
        academicYear,
        semester,
        versions: [],
      });

    let updated = (classDoc.versions || []).find((v) => v.label === "updated");
    if (!updated) {
      updated = { label: "updated", timeSlots: [], updatedAt: new Date() };
      classDoc.versions.push(updated);
    }

    // Remove overlapping day/period entries
    updated.timeSlots = updated.timeSlots.filter(
      (cs) => !slots.some((fs) => cs.day === fs.day && cs.period === fs.period)
    );
    // Add from faculty
    for (const s of slots) {
      updated.timeSlots.push({
        day: s.day,
        period: s.period,
        subject: s.subject,
        room: s.room,
        facultyId: facultyTimetableDoc.facultyId,
        isLab: s.isLab,
        isTheory: s.isTheory,
      });
    }

    classDoc.markModified("versions");
    ops.push(classDoc.save());
  }

  await Promise.all(ops);
}

// Utility queries
export async function getClassTimetable(branch, year, section) {
  const doc = await ClassTimetable.findOne({
    branch,
    year,
    section,
  }).populate(
    "versions.timeSlots.facultyId",
    "name email employeeId department subjects"
  );
  if (!doc) return null;
  const def = (doc.versions || []).find((v) => v.label === "default") || {
    timeSlots: [],
  };
  const upd = (doc.versions || []).find((v) => v.label === "current") || {
    timeSlots: [],
  };
  return { default: def, updated: upd, meta: doc };
}

export async function getFacultyTimetable(facultyId, academicYear, semester) {
  // Return the versioned FacultyTimetable document (if present)
  const doc = await FacultyTimetable.findOne({
    facultyId,
    academicYear,
    semester,
  }).populate("facultyId", "name email employeeId department subjects");

  if (!doc) {
    // Fallback: support legacy Timetable documents (older model) for compatibility
    const legacy = await Timetable.findOne({ facultyId }).populate(
      "facultyId",
      "name email employeeId department subjects"
    );
    if (!legacy) {
      console.warn(
        `[getFacultyTimetable] No timetable found for ${facultyId} in ${academicYear}, ${semester}`
      );
      return null;
    }

    // Convert legacy format to a versioned view (default)
    return {
      _id: legacy._id,
      facultyId: legacy.facultyId,
      academicYear: legacy.academicYear,
      semester: legacy.semester,
      versions: [
        {
          label: "default",
          timeSlots: legacy.timeSlots || [],
          updatedAt: legacy.updatedAt,
        },
      ],
      currentVersionLabel: "default",
    };
  }

  return doc;
}

export async function updateClassPeriod(
  classId,
  day,
  period,
  newSlot,
  updatedBy
) {
  const doc = await ClassTimetable.findById(classId);
  if (!doc) throw new Error("Class timetable not found");
  let upd = (doc.versions || []).find((v) => v.label === "updated");
  if (!upd) {
    upd = { label: "updated", timeSlots: [], updatedAt: new Date(), updatedBy };
    doc.versions.push(upd);
  }

  // Replace day/period
  upd.timeSlots = upd.timeSlots.filter(
    (s) => !(s.day === day && s.period === period)
  );
  upd.timeSlots.push({
    day,
    period,
    subject: newSlot.subject,
    room: newSlot.room,
    facultyId: newSlot.facultyId,
    isLab: !!newSlot.isLab,
    isTheory: !!newSlot.isTheory,
  });
  upd.updatedAt = new Date();
  upd.updatedBy = updatedBy;
  doc.markModified("versions");
  await doc.save();

  // Sync to faculty
  await syncClassToFaculty(doc, "updated");
  return doc;
}

export async function updateFacultyPeriod(
  facultyId,
  academicYear,
  semester,
  day,
  period,
  newSlot,
  updatedBy
) {
  const doc =
    (await FacultyTimetable.findOne({ facultyId, academicYear, semester })) ||
    new FacultyTimetable({ facultyId, academicYear, semester, versions: [] });

  const currentLabel = doc.currentVersionLabel || "default";
  const base = (doc.versions || []).find((v) => v.label === currentLabel) || {
    timeSlots: [],
  };

  // clone base
  const updatedSlots = JSON.parse(JSON.stringify(base.timeSlots || []));

  // remove existing slot for day/period
  const filtered = updatedSlots.filter(
    (s) => !(s.day === day && Number(s.period) === Number(period))
  );
  filtered.push({
    day,
    period,
    subject: newSlot.subject,
    branch: newSlot.branch,
    year: newSlot.year,
    section: newSlot.section,
    room: newSlot.room,
    isLab: !!newSlot.isLab,
    isTheory: !!newSlot.isTheory,
  });

  doc.versions.push({
    label: "updated",
    timeSlots: filtered,
    updatedAt: new Date(),
    updatedBy,
  });
  doc.currentVersionLabel = "updated";
  doc.markModified("versions");
  await doc.save();

  // Sync to class
  await syncFacultyToClass(doc);
  return doc;
}
