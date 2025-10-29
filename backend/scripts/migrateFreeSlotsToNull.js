// Migration script: Convert all "FREE" string values to null in timetable slots
import mongoose from "mongoose";
import ClassTimetable from "../src/Models/ClassTimetable.js";
import Timetable from "../src/Models/Timetable.js";
import connectMongoDB from "../src/database/db.js";

async function migrateClassTimetables() {
  const classTimetables = await ClassTimetable.find({});
  console.log(`Migrating ${classTimetables.length} ClassTimetables...`);

  for (const classDoc of classTimetables) {
    let docChanged = false;
    for (const version of classDoc.versions) {
      for (const slot of version.timeSlots) {
        // Convert "FREE" strings to null
        if (slot.subject === "FREE") {
          slot.subject = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        if (slot.room === "FREE") {
          slot.room = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        // facultyId can be null as it's not required
        if (slot.facultyId === "FREE") {
          slot.facultyId = null;
          docChanged = true;
        }
      }
    }
    if (docChanged) {
      await classDoc.save();
      console.log(`Updated ClassTimetable ${classDoc._id}`);
    }
  }
  console.log("ClassTimetable migration complete.");
}

async function migrateFacultyTimetables() {
  const facultyTimetables = await Timetable.find({
    facultyId: { $exists: true },
  });
  console.log(`Migrating ${facultyTimetables.length} FacultyTimetables...`);

  for (const facDoc of facultyTimetables) {
    let docChanged = false;
    for (const version of facDoc.versions) {
      for (const slot of version.timeSlots) {
        // Convert "FREE" strings to null
        if (slot.subject === "FREE") {
          slot.subject = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        if (slot.room === "FREE") {
          slot.room = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        if (slot.branch === "FREE") {
          slot.branch = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        if (slot.year === "FREE") {
          slot.year = "LEISURE"; // Special value for required field
          docChanged = true;
        }
        if (slot.section === "FREE") {
          slot.section = "LEISURE"; // Special value for required field
          docChanged = true;
        }
      }
    }
    if (docChanged) {
      await facDoc.save();
      console.log(`Updated FacultyTimetable ${facDoc._id}`);
    }
  }
  console.log("FacultyTimetable migration complete.");
}

async function main() {
  try {
    console.log("Starting migration of FREE strings to null...");
    await connectMongoDB();

    await migrateClassTimetables();
    await migrateFacultyTimetables();

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
