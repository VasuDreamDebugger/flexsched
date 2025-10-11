import bcrypt from 'bcryptjs';
import Faculty from '../Models/Faculty.js';
import Timetable from '../Models/Timetable.js';
import Admin from '../Models/Admin.js';
import addClassTimetableSampleData from './classTimetableSeed.js';

const sampleFaculties = [
  {
    name: "Dr. P. Sindhu",
    email: "p.sindhu@university.edu",
    password: "password123",
    branch: ["CSE", "IT"],
    subjects: ["Software Engineering", "Database Management", "Web Technologies"],
    employeeId: "F001",
    phoneNumber: "9876543210",
    designation: "Professor",
    department: "Computer Science & Engineering"
  },
  {
    name: "Dr. R. Kumar",
    email: "r.kumar@university.edu",
    password: "password123",
    branch: ["CSE"],
    subjects: ["Operating Systems", "Computer Networks", "System Programming"],
    employeeId: "F002",
    phoneNumber: "9876543211",
    designation: "Associate Professor",
    department: "Computer Science & Engineering"
  },
  {
    name: "Dr. S. Reddy",
    email: "s.reddy@university.edu",
    password: "password123",
    branch: ["CSE"],
    subjects: ["Data Structures", "Algorithms", "Programming"],
    employeeId: "F003",
    phoneNumber: "9876543212",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering"
  },
  {
    name: "Dr. A. Sharma",
    email: "a.sharma@university.edu",
    password: "password123",
    branch: ["CSE"],
    subjects: ["Machine Learning", "Artificial Intelligence", "Data Science"],
    employeeId: "F004",
    phoneNumber: "9876543213",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering"
  },
  {
    name: "Dr. M. Patel",
    email: "m.patel@university.edu",
    password: "password123",
    branch: ["IT"],
    subjects: ["Information Security", "Network Security", "Cryptography"],
    employeeId: "F005",
    phoneNumber: "9876543214",
    designation: "Assistant Professor",
    department: "Information Technology"
  }
];

const sampleTimetables = [
  // Faculty P. Sindhu's timetable
  {
    facultyId: null, // Will be set after faculty creation
    semester: "2024-2025",
    academicYear: "Even Semester",
    timeSlots: [
      {
        day: "Monday",
        periods: [1, 2],
        subject: "Software Engineering",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-101",
        isLab: false,
        isTheory: true
      },
      {
        day: "Monday",
        periods: [4],
        subject: "Software Engineering",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-101",
        isLab: false,
        isTheory: true
      },
      {
        day: "Monday",
        periods: [6],
        subject: "Software Engineering",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-101",
        isLab: false,
        isTheory: true
      },
      {
        day: "Tuesday",
        periods: [5, 6],
        subject: "Database Management",
        branch: "CSE",
        semester: "2nd Year",
        room: "CS-102",
        isLab: false,
        isTheory: true
      },
      {
        day: "Wednesday",
        periods: [3],
        subject: "Web Technologies",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-103",
        isLab: false,
        isTheory: true
      },
      {
        day: "Wednesday",
        periods: [4, 5, 6],
        subject: "Software Engineering Lab",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-Lab-1",
        isLab: true,
        isTheory: false
      },
      {
        day: "Thursday",
        periods: [1],
        subject: "Database Management",
        branch: "CSE",
        semester: "2nd Year",
        room: "CS-102",
        isLab: false,
        isTheory: true
      },
      {
        day: "Thursday",
        periods: [1, 2, 3],
        subject: "Web Technologies Lab",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-Lab-2",
        isLab: true,
        isTheory: false
      },
      {
        day: "Friday",
        periods: [4],
        subject: "Software Engineering",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-101",
        isLab: false,
        isTheory: true
      },
      {
        day: "Saturday",
        periods: [1],
        subject: "Software Engineering",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-101",
        isLab: false,
        isTheory: true
      },
      {
        day: "Saturday",
        periods: [3],
        subject: "Database Management",
        branch: "CSE",
        semester: "2nd Year",
        room: "CS-102",
        isLab: false,
        isTheory: true
      }
    ]
  },
  // Faculty R. Kumar's timetable
  {
    facultyId: null,
    semester: "2024-2025",
    academicYear: "Even Semester",
    timeSlots: [
      {
        day: "Monday",
        periods: [4, 5, 6],
        subject: "Operating Systems Lab",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-Lab-1",
        isLab: true,
        isTheory: false
      },
      {
        day: "Monday",
        periods: [4],
        subject: "Computer Networks",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-104",
        isLab: false,
        isTheory: true
      },
      {
        day: "Tuesday",
        periods: [1],
        subject: "Operating Systems",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-105",
        isLab: false,
        isTheory: true
      },
      {
        day: "Tuesday",
        periods: [1, 2, 3],
        subject: "Computer Networks Lab",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-Lab-3",
        isLab: true,
        isTheory: false
      },
      {
        day: "Wednesday",
        periods: [1],
        subject: "Operating Systems",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-105",
        isLab: false,
        isTheory: true
      },
      {
        day: "Wednesday",
        periods: [2],
        subject: "Computer Networks",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-104",
        isLab: false,
        isTheory: true
      },
      {
        day: "Thursday",
        periods: [1, 2, 3],
        subject: "System Programming Lab",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-Lab-2",
        isLab: true,
        isTheory: false
      },
      {
        day: "Friday",
        periods: [1],
        subject: "Computer Networks",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-104",
        isLab: false,
        isTheory: true
      },
      {
        day: "Friday",
        periods: [2],
        subject: "Operating Systems",
        branch: "CSE",
        semester: "3rd Year",
        room: "CS-105",
        isLab: false,
        isTheory: true
      }
    ]
  }
];

const sampleAdmins = [
  {
    username: "admin",
    email: "admin@university.edu",
    password: "admin123",
    role: "super_admin"
  },
  {
    username: "developer",
    email: "developer@university.edu",
    password: "dev123",
    role: "developer"
  }
];

export const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");

    // Clear existing data (optional - remove in production)
    await Faculty.deleteMany({});
    await Timetable.deleteMany({});
    await Admin.deleteMany({});

    // Create admins
    console.log("Creating admins...");
    const createdAdmins = [];
    for (const adminData of sampleAdmins) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      const admin = new Admin({
        ...adminData,
        password: hashedPassword
      });
      await admin.save();
      createdAdmins.push(admin);
      console.log(`Created admin: ${admin.username}`);
    }

    // Create faculties
    console.log("Creating faculties...");
    const createdFaculties = [];
    for (const facultyData of sampleFaculties) {
      const hashedPassword = await bcrypt.hash(facultyData.password, 12);
      const faculty = new Faculty({
        ...facultyData,
        password: hashedPassword
      });
      await faculty.save();
      createdFaculties.push(faculty);
      console.log(`Created faculty: ${faculty.name}`);
    }

    // Create timetables
    console.log("Creating timetables...");
    for (let i = 0; i < Math.min(sampleTimetables.length, createdFaculties.length); i++) {
      const timetableData = {
        ...sampleTimetables[i],
        facultyId: createdFaculties[i]._id
      };
      
      const timetable = new Timetable(timetableData);
      await timetable.save();
      
      // Update faculty's timetableId reference
      await Faculty.findByIdAndUpdate(createdFaculties[i]._id, {
        timetableId: timetable._id
      });
      
      console.log(`Created timetable for: ${createdFaculties[i].name}`);
    }

    // Add class timetable sample data
    await addClassTimetableSampleData();

    console.log("Database seeding completed successfully!");
    console.log(`Created ${createdAdmins.length} admins`);
    console.log(`Created ${createdFaculties.length} faculties`);
    console.log(`Created ${Math.min(sampleTimetables.length, createdFaculties.length)} timetables`);
    console.log(`Created 4 class timetables`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};

export default seedDatabase;
