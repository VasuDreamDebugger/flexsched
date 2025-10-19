import connectMongoDB from "../database/db.js";
import Admin from "../Models/Admin.js";
import Faculty from "../Models/Faculty.js";
import Timetable from "../Models/Timetable.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";

const inspect = async () => {
  try {
    await connectMongoDB();
    const adminCount = await Admin.countDocuments();
    const facultyCount = await Faculty.countDocuments();
    const timetableCount = await Timetable.countDocuments();
    const facultyTTCount = await FacultyTimetable.countDocuments();

    console.log("Admins:", adminCount);
    console.log("Faculties:", facultyCount);
    console.log("Class Timetables:", timetableCount);
    console.log("Faculty Timetables:", facultyTTCount);

    const dev = await Admin.findOne({
      email: "developer@university.edu",
    }).select("+password");
    if (dev) console.log("Developer admin found:", dev.email);
    else console.log("Developer admin not found");

    process.exit(0);
  } catch (error) {
    console.error("Inspect error:", error);
    process.exit(1);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  inspect();
}

export default inspect;
