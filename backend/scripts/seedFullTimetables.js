// Seed script: Ensures every day/period is present in all timetables, with explicit free slots
import mongoose from "mongoose";
import ClassTimetable from "../src/Models/ClassTimetable.js";
import Timetable from "../src/Models/Timetable.js";
import connectMongoDB from "../src/database/db.js";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const PERIODS = [1, 2, 3, 4, 5, 6];

async function seedClassTimetables() {
  const classTimetables = await ClassTimetable.find({});
  for (const classDoc of classTimetables) {
    for (const version of classDoc.versions) {
      const slots = version.timeSlots || [];
      const slotMap = new Map();
      slots.forEach((slot) => slotMap.set(`${slot.day}-${slot.period}`, slot));
      let changed = false;
      for (const day of DAYS) {
        for (const period of PERIODS) {
          const key = `${day}-${period}`;
          if (!slotMap.has(key)) {
            slots.push({
              day,
              period,
              subject: "LEISURE", // Special value for required field
              facultyId: null, // Can be null as it's not required
              room: "LEISURE", // Special value for required field
              isLab: false,
              isTheory: false,
              semester: classDoc.semester,
            });
            changed = true;
          }
        }
      }
      if (changed) version.timeSlots = slots;
    }
    await classDoc.save();
  }
  console.log("ClassTimetables seeded with explicit free slots.");
}

async function seedFacultyTimetables() {
  const facultyTimetables = await Timetable.find({
    facultyId: { $exists: true },
  });
  for (const facDoc of facultyTimetables) {
    for (const version of facDoc.versions) {
      const slots = version.timeSlots || [];
      const slotMap = new Map();
      slots.forEach((slot) => slotMap.set(`${slot.day}-${slot.period}`, slot));
      let changed = false;
      for (const day of DAYS) {
        for (const period of PERIODS) {
          const key = `${day}-${period}`;
          if (!slotMap.has(key)) {
            slots.push({
              day,
              periods: [period],
              subject: "LEISURE", // Special value for required field
              branch: "LEISURE", // Special value for required field
              year: "LEISURE", // Special value for required field
              section: "LEISURE", // Special value for required field
              room: "LEISURE", // Special value for required field
              isLab: false,
              isTheory: false,
              semester: facDoc.semester,
            });
            changed = true;
          }
        }
      }
      if (changed) version.timeSlots = slots;
    }
    await facDoc.save();
  }
  console.log("FacultyTimetables seeded with explicit free slots.");
}

async function main() {
  await connectMongoDB();
  await seedClassTimetables();
  await seedFacultyTimetables();
  await mongoose.disconnect();
  console.log("Seeding complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
