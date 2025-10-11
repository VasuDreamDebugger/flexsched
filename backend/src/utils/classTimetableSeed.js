import Timetable from '../Models/Timetable.js';
import Faculty from '../Models/Faculty.js';

const addClassTimetableSampleData = async () => {
  try {
    console.log('Adding class timetable sample data...');

    // Get existing faculties
    const faculties = await Faculty.find({});
    if (faculties.length === 0) {
      console.log('No faculties found. Please seed faculties first.');
      return;
    }

    const facultyMap = {
      'Dr. P. Sindhu': faculties.find(f => f.name === 'Dr. P. Sindhu')?._id,
      'Dr. R. Kumar': faculties.find(f => f.name === 'Dr. R. Kumar')?._id,
      'Dr. S. Reddy': faculties.find(f => f.name === 'Dr. S. Reddy')?._id,
      'Dr. A. Sharma': faculties.find(f => f.name === 'Dr. A. Sharma')?._id,
      'Dr. M. Patel': faculties.find(f => f.name === 'Dr. M. Patel')?._id,
    };

    // CSE 3rd Year Section A Class Timetable
    const cse3A_timetable = new Timetable({
      facultyId: facultyMap['Dr. P. Sindhu'],
      semester: '2024-2025',
      academicYear: 'Odd Semester',
      isClassTimetable: true,
      classDetails: {
        branch: 'CSE',
        year: '3rd Year',
        section: 'A'
      },
      timeSlots: [
        {
          day: 'Monday',
          periods: [1, 2],
          subject: 'Software Engineering',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-101',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Monday',
          periods: [4],
          subject: 'Database Management',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-102',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Tuesday',
          periods: [3, 4],
          subject: 'Web Technologies',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-103',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Wednesday',
          periods: [1, 2],
          subject: 'Data Structures',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-104',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Wednesday',
          periods: [5, 6],
          subject: 'Software Engineering Lab',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-Lab-1',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Thursday',
          periods: [1, 2, 3],
          subject: 'Database Lab',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-Lab-2',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Friday',
          periods: [1],
          subject: 'Software Engineering',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-101',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Saturday',
          periods: [4, 5, 6],
          subject: 'Web Technologies Lab',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'A',
          room: 'CS-Lab-1',
          isLab: true,
          isTheory: false
        }
      ]
    });

    // CSE 3rd Year Section B Class Timetable
    const cse3B_timetable = new Timetable({
      facultyId: facultyMap['Dr. M. Patel'],
      semester: '2024-2025',
      academicYear: 'Odd Semester',
      isClassTimetable: true,
      classDetails: {
        branch: 'CSE',
        year: '3rd Year',
        section: 'B'
      },
      timeSlots: [
        {
          day: 'Monday',
          periods: [2, 3],
          subject: 'Computer Networks',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-105',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Tuesday',
          periods: [1, 2],
          subject: 'Software Engineering',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-101',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Wednesday',
          periods: [4, 5],
          subject: 'Database Management',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-102',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Thursday',
          periods: [1, 2],
          subject: 'Web Technologies',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-103',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Thursday',
          periods: [5, 6],
          subject: 'Computer Networks Lab',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-Lab-2',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Friday',
          periods: [3, 4],
          subject: 'Data Structures',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-104',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Saturday',
          periods: [1, 2],
          subject: 'Software Engineering Lab',
          branch: 'CSE',
          semester: '3rd Year',
          section: 'B',
          room: 'CS-Lab-1',
          isLab: true,
          isTheory: false
        }
      ]
    });

    // CSE 2nd Year Section A Class Timetable
    const cse2A_timetable = new Timetable({
      facultyId: facultyMap['Dr. S. Reddy'],
      semester: '2024-2025',
      academicYear: 'Odd Semester',
      isClassTimetable: true,
      classDetails: {
        branch: 'CSE',
        year: '2nd Year',
        section: 'A'
      },
      timeSlots: [
        {
          day: 'Monday',
          periods: [1, 2],
          subject: 'Object Oriented Programming',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-201',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Tuesday',
          periods: [3, 4],
          subject: 'Data Structures',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-202',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Wednesday',
          periods: [2, 3],
          subject: 'Computer Networks',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-203',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Thursday',
          periods: [1, 2],
          subject: 'Database Systems',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-204',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Friday',
          periods: [5, 6],
          subject: 'OOP Lab',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-Lab-1',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Saturday',
          periods: [4, 5, 6],
          subject: 'Data Structures Lab',
          branch: 'CSE',
          semester: '2nd Year',
          section: 'A',
          room: 'CS-Lab-2',
          isLab: true,
          isTheory: false
        }
      ]
    });

    // IT 3rd Year Section A Class Timetable
    const it3A_timetable = new Timetable({
      facultyId: facultyMap['Dr. A. Sharma'],
      semester: '2024-2025',
      academicYear: 'Odd Semester',
      isClassTimetable: true,
      classDetails: {
        branch: 'IT',
        year: '3rd Year',
        section: 'A'
      },
      timeSlots: [
        {
          day: 'Monday',
          periods: [2, 3],
          subject: 'Information Security',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-101',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Tuesday',
          periods: [1, 2],
          subject: 'Software Testing',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-102',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Wednesday',
          periods: [4, 5],
          subject: 'Mobile Computing',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-103',
          isLab: false,
          isTheory: true
        },
        {
          day: 'Thursday',
          periods: [4, 5, 6],
          subject: 'Information Security Lab',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-Lab-1',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Friday',
          periods: [1, 2],
          subject: 'Software Testing Lab',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-Lab-2',
          isLab: true,
          isTheory: false
        },
        {
          day: 'Saturday',
          periods: [1, 2, 3],
          subject: 'Mobile Computing Lab',
          branch: 'IT',
          semester: '3rd Year',
          section: 'A',
          room: 'IT-Lab-1',
          isLab: true,
          isTheory: false
        }
      ]
    });

    // Save all class timetables
    await Promise.all([
      cse3A_timetable.save(),
      cse3B_timetable.save(),
      cse2A_timetable.save(),
      it3A_timetable.save()
    ]);

    console.log('Class timetable sample data added successfully!');
    console.log('Created 4 class timetables:');
    console.log('- CSE 3rd Year Section A');
    console.log('- CSE 3rd Year Section B');
    console.log('- CSE 2nd Year Section A');
    console.log('- IT 3rd Year Section A');

  } catch (error) {
    console.error('Error adding class timetable sample data:', error);
    throw error;
  }
};

export default addClassTimetableSampleData;
