import mongoose from 'mongoose';
import ClassTimetable from '../Models/ClassTimetable.js';
import Faculty from '../Models/Faculty.js';

const seedClassTimetable = async () => {
  try {
    console.log('🌱 Starting ClassTimetable seeding...');

    // Get faculty IDs from database
    const faculties = await Faculty.find({}).select('_id name');
    console.log('📋 Found faculties:', faculties.map(f => ({ id: f._id, name: f.name })));

    // Create faculty mapping for easy reference
    const facultyMap = {};
    faculties.forEach(faculty => {
      facultyMap[faculty.name] = faculty._id;
    });

    console.log('🔍 Faculty mapping:', facultyMap);

    // Define class timetable data
    const classTimetableData = [
      {
        branch: 'CSE',
        year: '3rd Year',
        section: 'A',
        academicYear: '2024-2025',
        semester: 'Odd Semester',
        versions: [
          {
            label: 'default',
            timeSlots: [
              {
                day: 'Monday',
                period: 1,
                subject: 'Software Engineering',
                room: 'CS-101',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 2,
                subject: 'Software Engineering',
                room: 'CS-101',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 4,
                subject: 'Database Management',
                room: 'CS-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 3,
                subject: 'Web Technologies',
                room: 'CS-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 4,
                subject: 'Web Technologies',
                room: 'CS-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 1,
                subject: 'Data Structures',
                room: 'CS-104',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 2,
                subject: 'Data Structures',
                room: 'CS-104',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 5,
                subject: 'Software Engineering Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Wednesday',
                period: 6,
                subject: 'Software Engineering Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 2,
                subject: 'Database Lab',
                room: 'CS-Lab-2',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 3,
                subject: 'Database Lab',
                room: 'CS-Lab-2',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Friday',
                period: 1,
                subject: 'Software Engineering',
                room: 'CS-101',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Saturday',
                period: 3,
                subject: 'Web Technologies Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Saturday',
                period: 4,
                subject: 'Web Technologies Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: true,
                isTheory: false
              }
            ]
          }
        ]
      },
      {
        branch: 'CSE',
        year: '3rd Year',
        section: 'B',
        academicYear: '2024-2025',
        semester: 'Odd Semester',
        versions: [
          {
            label: 'default',
            timeSlots: [
              {
                day: 'Monday',
                period: 2,
                subject: 'Computer Networks',
                room: 'CS-105',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 3,
                subject: 'Computer Networks',
                room: 'CS-105',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 1,
                subject: 'Software Engineering',
                room: 'CS-101',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 2,
                subject: 'Software Engineering',
                room: 'CS-101',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 4,
                subject: 'Database Management',
                room: 'CS-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 5,
                subject: 'Database Management',
                room: 'CS-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Thursday',
                period: 1,
                subject: 'Web Technologies',
                room: 'CS-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Thursday',
                period: 2,
                subject: 'Web Technologies',
                room: 'CS-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Thursday',
                period: 5,
                subject: 'Computer Networks Lab',
                room: 'CS-Lab-2',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 6,
                subject: 'Computer Networks Lab',
                room: 'CS-Lab-2',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Friday',
                period: 3,
                subject: 'Data Structures',
                room: 'CS-104',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Friday',
                period: 4,
                subject: 'Data Structures',
                room: 'CS-104',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Saturday',
                period: 1,
                subject: 'Software Engineering Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Saturday',
                period: 2,
                subject: 'Software Engineering Lab',
                room: 'CS-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              }
            ]
          }
        ]
      },
      {
        branch: 'ECE',
        year: '3rd Year',
        section: 'C',
        academicYear: '2024-2025',
        semester: 'Odd Semester',
        versions: [
          {
            label: 'default',
            timeSlots: [
              {
                day: 'Monday',
                period: 1,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 2,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 4,
                subject: 'Signals & Systems',
                room: 'ECE-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Monday',
                period: 5,
                subject: 'Digital Electronics Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Monday',
                period: 6,
                subject: 'Digital Electronics Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Tuesday',
                period: 1,
                subject: 'Communication Systems',
                room: 'ECE-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 2,
                subject: 'VLSI Design',
                room: 'ECE-104',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Tuesday',
                period: 3,
                subject: 'VLSI Design',
                room: 'ECE-104',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 1,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 2,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 3,
                subject: 'Communication Systems',
                room: 'ECE-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Wednesday',
                period: 5,
                subject: 'VLSI Design Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Wednesday',
                period: 6,
                subject: 'VLSI Design Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 1,
                subject: 'Communication Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 2,
                subject: 'Communication Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 3,
                subject: 'Communication Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Thursday',
                period: 4,
                subject: 'Signals & Systems',
                room: 'ECE-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Friday',
                period: 1,
                subject: 'VLSI Design',
                room: 'ECE-104',
                facultyId: facultyMap['Dr. M. Patel'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Friday',
                period: 2,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Friday',
                period: 3,
                subject: 'Digital Electronics',
                room: 'ECE-101',
                facultyId: facultyMap['Dr. A. Sharma'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Friday',
                period: 4,
                subject: 'Microprocessor Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Friday',
                period: 5,
                subject: 'Microprocessor Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Friday',
                period: 6,
                subject: 'Microprocessor Lab',
                room: 'ECE-Lab-1',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Saturday',
                period: 1,
                subject: 'Communication Systems',
                room: 'ECE-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Saturday',
                period: 2,
                subject: 'Communication Systems',
                room: 'ECE-103',
                facultyId: facultyMap['Dr. S. Reddy'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Saturday',
                period: 3,
                subject: 'Signals & Systems',
                room: 'ECE-102',
                facultyId: facultyMap['Dr. R. Kumar'],
                isLab: false,
                isTheory: true
              },
              {
                day: 'Saturday',
                period: 4,
                subject: 'Embedded Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Saturday',
                period: 5,
                subject: 'Embedded Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              },
              {
                day: 'Saturday',
                period: 6,
                subject: 'Embedded Systems Lab',
                room: 'ECE-Lab-2',
                facultyId: facultyMap['Dr. P. Sindhu'],
                isLab: true,
                isTheory: false
              }
            ]
          }
        ]
      }
    ];

    // Clear existing ClassTimetable documents
    await ClassTimetable.deleteMany({});
    console.log('🗑️ Cleared existing ClassTimetable documents');

    // Insert new ClassTimetable documents
    const insertedDocs = await ClassTimetable.insertMany(classTimetableData);
    console.log('✅ Inserted ClassTimetable documents:', insertedDocs.length);

    // Log the inserted document IDs for frontend reference
    console.log('\n📋 ClassTimetable Document IDs for Frontend:');
    insertedDocs.forEach(doc => {
      console.log(`${doc.branch} ${doc.year} Section ${doc.section}: ${doc._id}`);
    });

    console.log('\n🎉 ClassTimetable seeding completed successfully!');
    return insertedDocs;

  } catch (error) {
    console.error('❌ Error seeding ClassTimetable:', error);
    throw error;
  }
};

export default seedClassTimetable;
