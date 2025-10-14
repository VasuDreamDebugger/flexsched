import FacultyTimetable from '../Models/FacultyTimetable.js';
import ClassTimetable from '../Models/ClassTimetable.js';

// Sync a class timetable version to faculty timetables (upsert per faculty/day/period)
export async function syncClassToFaculty(classTimetableDoc, versionLabel = 'updated') {
  const version = (classTimetableDoc.versions || []).find(v => v.label === versionLabel) ||
                  (classTimetableDoc.versions || []).find(v => v.label === 'default');
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
    const doc = await FacultyTimetable.findOne({ facultyId, academicYear, semester }) ||
               new FacultyTimetable({ facultyId, academicYear, semester, timeSlots: [] });

    // Remove existing entries for the same day/periods for this class (branch/year/section)
    doc.timeSlots = doc.timeSlots.filter(s => !slots.some(ns => ns.day === s.day && ns.period === s.period));

    // Add mapped slots
    for (const s of slots) {
      doc.timeSlots.push({
        day: s.day,
        period: s.period,
        subject: s.subject,
        branch: classTimetableDoc.branch,
        year: classTimetableDoc.year,
        section: classTimetableDoc.section,
        room: s.room,
        isLab: s.isLab,
        isTheory: s.isTheory
      });
    }

    doc.markModified('timeSlots');
    ops.push(doc.save());
  }

  await Promise.all(ops);
}

// Sync a faculty timetable to class updated version for its class slots
export async function syncFacultyToClass(facultyTimetableDoc) {
  const { academicYear, semester } = facultyTimetableDoc;

  // Group faculty slots by class identity
  const byClass = new Map();
  for (const s of facultyTimetableDoc.timeSlots) {
    const key = `${s.branch}|${s.year}|${s.section}`;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key).push(s);
  }

  const ops = [];
  for (const [key, slots] of byClass.entries()) {
    const [branch, year, section] = key.split('|');
    const classDoc = await ClassTimetable.findOne({ branch, year, section, academicYear, semester })
                    || new ClassTimetable({ branch, year, section, academicYear, semester, versions: [] });

    let updated = (classDoc.versions || []).find(v => v.label === 'updated');
    if (!updated) {
      updated = { label: 'updated', timeSlots: [], updatedAt: new Date() };
      classDoc.versions.push(updated);
    }

    // Remove overlapping day/period entries
    updated.timeSlots = updated.timeSlots.filter(cs => !slots.some(fs => cs.day === fs.day && cs.period === fs.period));
    // Add from faculty
    for (const s of slots) {
      updated.timeSlots.push({
        day: s.day,
        period: s.period,
        subject: s.subject,
        room: s.room,
        facultyId: facultyTimetableDoc.facultyId,
        isLab: s.isLab,
        isTheory: s.isTheory
      });
    }

    classDoc.markModified('versions');
    ops.push(classDoc.save());
  }

  await Promise.all(ops);
}

// Utility queries
export async function getClassTimetable(branch, year, section, academicYear, semester) {
  const doc = await ClassTimetable.findOne({ branch, year, section, academicYear, semester })
    .populate('versions.timeSlots.facultyId', 'name email employeeId department subjects');
  if (!doc) return null;
  const def = (doc.versions || []).find(v => v.label === 'default') || { timeSlots: [] };
  const upd = (doc.versions || []).find(v => v.label === 'updated') || { timeSlots: [] };
  return { default: def, updated: upd, meta: doc };
}

export async function getFacultyTimetable(facultyId, academicYear, semester) {
  const doc = await FacultyTimetable.findOne({ facultyId, academicYear, semester })
    .populate('facultyId', 'name email employeeId department subjects');
  return doc;
}

export async function updateClassPeriod(classId, day, period, newSlot, updatedBy) {
  const doc = await ClassTimetable.findById(classId);
  if (!doc) throw new Error('Class timetable not found');
  let upd = (doc.versions || []).find(v => v.label === 'updated');
  if (!upd) { upd = { label: 'updated', timeSlots: [], updatedAt: new Date(), updatedBy }; doc.versions.push(upd); }

  // Replace day/period
  upd.timeSlots = upd.timeSlots.filter(s => !(s.day === day && s.period === period));
  upd.timeSlots.push({ day, period, subject: newSlot.subject, room: newSlot.room, facultyId: newSlot.facultyId, isLab: !!newSlot.isLab, isTheory: !!newSlot.isTheory });
  upd.updatedAt = new Date();
  upd.updatedBy = updatedBy;
  doc.markModified('versions');
  await doc.save();

  // Sync to faculty
  await syncClassToFaculty(doc, 'updated');
  return doc;
}

export async function updateFacultyPeriod(facultyId, academicYear, semester, day, period, newSlot) {
  const doc = await FacultyTimetable.findOne({ facultyId, academicYear, semester }) || new FacultyTimetable({ facultyId, academicYear, semester, timeSlots: [] });
  doc.timeSlots = doc.timeSlots.filter(s => !(s.day === day && s.period === period));
  doc.timeSlots.push({ day, period, subject: newSlot.subject, branch: newSlot.branch, year: newSlot.year, section: newSlot.section, room: newSlot.room, isLab: !!newSlot.isLab, isTheory: !!newSlot.isTheory });
  doc.markModified('timeSlots');
  await doc.save();

  // Sync to class
  await syncFacultyToClass(doc);
  return doc;
}


