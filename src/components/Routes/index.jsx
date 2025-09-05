import { Routes, Route } from "react-router-dom";
import Home from "../Home";
import FacultyLogin from "../FacultyLogin";
import FacultyPage from "../FacultyPage";
import FacultyDashboard from "../FacultyDashboard";
import Signup from "../Auth/Signup";
import StudentDashboard from "../StudentDashboard/StudentDashboard";
import LearnMore from "../LearnMore/LearnMore";  // ✅ add this
import Students from "../Students"  // ✅ add this

const RoutesPage = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/learn-more" element={<LearnMore />} />  {/* ✅ added */}

    {/* Faculty Routes */}
    <Route path="/facultylogin" element={<FacultyLogin />} />
    <Route path="/faculty" element={<FacultyPage />} />
    <Route path="/facultydashboard" element={<FacultyDashboard />} />

    {/* Student Route */}
    <Route path="/students" element={<Students />} /> {/* ✅ lowercase */}
  </Routes>
);

export default RoutesPage;
