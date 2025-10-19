import bcrypt from "bcryptjs";
import connectMongoDB from "../database/db.js";
import Faculty from "../Models/Faculty.js";
import Timetable from "../Models/Timetable.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";

const seedSampleData = async () => {
  try {
    await connectMongoDB();

    // Check if sample faculties exist
    const existing = await Faculty.findOne({ employeeId: "F1001" });
    if (existing) {
      console.log("Sample faculties already exist. Skipping seeding.");
      return;
    }

    const saltRounds = 12;
    const pass1 = await bcrypt.hash("password1", saltRounds);
    const pass2 = await bcrypt.hash("password2", saltRounds);

    // Create two sample faculties
    const fac1 = await Faculty.create({
      name: "Dr. Alice Kumar",
      email: "alice@university.edu",
      password: pass1,
      branch: ["CSE"],
      subjects: ["Software Engineering", "Algorithms"],
      employeeId: "F1001",
      phoneNumber: "+911234567890",
      designation: "Associate Professor",
      department: "CSE",
    });

    const fac2 = await Faculty.create({
      name: "Mr. Bob Rao",
      email: "bob@university.edu",
      password: pass2,
      branch: ["IT"],
      subjects: ["Database Systems", "Web Technologies"],
      employeeId: "F1002",
      phoneNumber: "+919876543210",
      designation: "Lecturer",
      department: "IT",
    });

    console.log("Created sample faculties:", fac1.employeeId, fac2.employeeId);

    // Create a faculty timetable for fac1
    // FacultyTimetable expects single-period slots (field `period`) and requires `year` and `section`.
    const ft1 = await FacultyTimetable.create({
      facultyId: fac1._id,
      academicYear: "Odd Semester",
      semester: "2024-2025",
      versions: [
        {
          label: "default",
          timeSlots: [
            {
              day: "Monday",
              period: 1,
              subject: "Software Engineering",
              branch: "CSE",
              year: "3rd Year",
              section: "A",
              room: "CS-101",
              isLab: false,
            },
            {
              day: "Monday",
              period: 2,
              subject: "Software Engineering",
              branch: "CSE",
              year: "3rd Year",
              section: "A",
              room: "CS-101",
              isLab: false,
            },
            {
              day: "Wednesday",
              period: 3,
              subject: "Algorithms",
              branch: "CSE",
              year: "3rd Year",
              section: "A",
              room: "CS-102",
              isLab: false,
            },
            {
              day: "Wednesday",
              period: 4,
              subject: "Algorithms",
              branch: "CSE",
              year: "3rd Year",
              section: "A",
              room: "CS-102",
              isLab: false,
            },
          ],
          updatedAt: new Date(),
        },
      ],
      currentVersionLabel: "default",
    });

    // Link fac1 timetable
    fac1.timetableId = ft1._id;
    await fac1.save();

    // Create a class timetable linked to fac2
    const tt1 = await Timetable.create({
      facultyId: fac2._id,
      academicYear: "Odd Semester",
      semester: "2024-2025",
      timeSlots: [
        {
          day: "Tuesday",
          periods: [1, 2],
          subject: "Database Systems",
          branch: "IT",
          semester: "3rd Year",
          section: "A",
          room: "IT-201",
          isLab: false,
        },
        {
          day: "Thursday",
          periods: [4, 5],
          subject: "Web Technologies",
          branch: "IT",
          semester: "3rd Year",
          section: "A",
          room: "IT-202",
          isLab: true,
        },
      ],
    });

    console.log("Created faculty timetable and class timetable");
  } catch (error) {
    console.error("Error seeding sample data:", error);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedSampleData().then(() => process.exit());
}

export default seedSampleData;
