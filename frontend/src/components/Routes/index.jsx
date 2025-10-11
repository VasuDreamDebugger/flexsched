import { Routes, Route } from "react-router-dom";
import Home from "../Home";
import FacultyLogin from "../FacultyLogin";
import FacultyPage from "../FacultyPage";
import FacultyDashboard from "../FacultyDashboard";
import RequestsPage from "../Requests/RequestsPage";
import Signup from "../Auth/Signup";
import StudentDashboard from "../StudentDashboard/StudentDashboard";
import LearnMore from "../LearnMore/LearnMore";  // ✅ add this
import Students from "../Students";  // ✅ add this
import DeveloperPage from "../Developer/DeveloperPage";
import AddFaculty from "../Developer/AddFaculty";
import AddFacultyTimetable from "../Developer/AddFacultyTimetable";
import AddClassTimetable from "../Developer/AddClassTimetable";

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
    <Route path="/requests" element={<RequestsPage />} />

    {/* Developer Routes */}
    <Route path="/developer" element={<DeveloperPage />} />
    <Route path="/developer/add-faculty" element={<AddFaculty />} />
    <Route path="/developer/add-faculty-timetable" element={<AddFacultyTimetable />} />
    <Route path="/developer/add-class-timetable" element={<AddClassTimetable />} />

    {/* Student Route */}
    <Route path="/students" element={<Students />} /> {/* ✅ lowercase */}
  </Routes>
);

export default RoutesPage;
