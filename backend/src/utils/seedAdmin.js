import bcrypt from "bcryptjs";
import Admin from "../Models/Admin.js";
import connectMongoDB from "../database/db.js";

const seedAdmin = async () => {
  try {
    await connectMongoDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: "developer@university.edu",
    });

    if (existingAdmin) {
      console.log("Developer admin account already exists");
      return;
    }

    // Create demo admin account
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("dev123", saltRounds);

    const adminData = {
      username: "Developer Admin",
      email: "developer@university.edu",
      password: hashedPassword,
      role: "developer",
      isActive: true,
    };

    await Admin.create(adminData);
    console.log("Successfully created developer admin account");
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};

// Run seed if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedAdmin().then(() => process.exit());
}

export default seedAdmin;
