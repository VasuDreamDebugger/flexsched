import connectMongoDB from "../database/db.js";
import Faculty from "../Models/Faculty.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";

const createMissing = async () => {
  try {
    await connectMongoDB();

    const faculties = await Faculty.find({});
    for (const f of faculties) {
      const exists = await FacultyTimetable.findOne({ facultyId: f._id });
      if (!exists) {
        console.log(
          `Creating empty FacultyTimetable for ${f.employeeId} (${f.name})`
        );
        const ft = new FacultyTimetable({
          facultyId: f._id,
          academicYear: "Odd Semester",
          semester: "2024-2025",
          versions: [
            { label: "default", timeSlots: [], updatedAt: new Date() },
          ],
          currentVersionLabel: "default",
        });
        await ft.save();
        f.timetableId = ft._id;
        await f.save();
      }
    }

    console.log("Done creating missing faculty timetables");
    process.exit(0);
  } catch (error) {
    console.error("Error creating missing faculty timetables:", error);
    process.exit(1);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) createMissing();

export default createMissing;
