import { useState, useEffect, use} from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/modalContext";
import "./index.css";

const Header = () => {
  const { openFacultyModal } = useModal();
  const [activeSection, setActiveSection] = useState("");

  const navigate=useNavigate();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Detect current section while scrolling
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["features", "testimonials", "contact"];
      let current = "";
      sections.forEach((id) => {
        const section = document.getElementById(id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = id;
          }
        }
      });
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="d-flex justify-content-between align-items-center header-flex p-3">
      {/* Logo */}
      <img
        src="/logo.jpeg" // Place logo.jpeg in public folder
        alt="project logo"
        className="img"
        style={{ height: "60px", cursor: "pointer" }}
        onClick={() => scrollToSection("top")}
      />

      {/* Center Navigation */}
      <ul className=" d-flex justify-content-center gap-5 m-0 p-0" style={{ listStyle: "none" }}>
        <li
          className={`list-style mr-2 ${activeSection === "features" ? "active-link" : ""}`}
          onClick={() => scrollToSection("features")}
        >
          Features
        </li>
        <li
          className={`list-style mr-2 ${activeSection === "testimonials" ? "active-link" : ""}`}
          onClick={() => scrollToSection("testimonials")}
        >
          Testimonials
        </li>
        <li
          className={`list-style mr-2 ${activeSection === "contact" ? "active-link" : ""}`}
          onClick={() => scrollToSection("contact")}
        >
          Contact
        </li>
      </ul>

      {/* Right-side Login Buttons */}
      <div className="d-flex gap-5">
        <li
          className="list-style logins"
          style={{ cursor: "pointer" }}
          onClick={openFacultyModal}
        >
          Faculty
        </li>
        <li
          className="list-style logins"
          style={{ cursor: "pointer" }}
          onClick={()=>{
            navigate("/students")
          }} // This triggers the StudentDashboard
        >
          Student
        </li>
         
      </div>
    </nav>
  );
};

export default Header;
