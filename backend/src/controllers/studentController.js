import Student from '../Models/Student.js';

export const createStudent = async (req, res) => {
  try {
    const { name, email, password, branch, year, section } = req.body;
    if (!name || !email || !password || !branch || !year || !section) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (year < 1 || year > 4) {
      return res.status(400).json({ success: false, message: 'Year must be between 1 and 4' });
    }
    const student = new Student({ name, email, password, branch, year, section });
    await student.save();
    res.status(201).json({ success: true, message: 'Student created', data: { student } });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createStudentsBulk = async (req, res) => {
  try {
    const { branches = [], years = [], sections = [], countPerSection = 10 } = req.body;
    if (!branches.length || !years.length || !sections.length) {
      return res.status(400).json({ success: false, message: 'branches, years, sections are required arrays' });
    }

    const docs = [];
    branches.forEach(branch => {
      years.forEach(year => {
        sections.forEach(section => {
          for (let i = 1; i <= countPerSection; i++) {
            const num = String(i).padStart(3, '0');
            const email = `${branch.toLowerCase()}_${year}_${section}_${num}@student.flexsched.test`;
            docs.push({
              name: `Student ${branch}-${year}-${section}-${num}`,
              email,
              password: 'password123',
              branch,
              year,
              section,
              isActive: true
            });
          }
        });
      });
    });

    const created = await Student.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, message: 'Students created', data: { created: created.length } });
  } catch (error) {
    console.error('Bulk create students error:', error);
    // Even with duplicate errors, some may be inserted
    res.status(500).json({ success: false, message: 'Bulk creation encountered errors' });
  }
};

export const queryStudents = async (req, res) => {
  try {
    const { branch, year, section } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
    if (year) filter.year = Number(year);
    if (section) filter.section = section;
    filter.isActive = true;
    const students = await Student.find(filter).select('-password');
    res.status(200).json({ success: true, data: { students } });
  } catch (error) {
    console.error('Query students error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


