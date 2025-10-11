import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FacultyLogin from "../FacultyLogin";
import Header from "../Header";
import Footer from "../Footer/Footer";
import StudentDashboard from "../StudentDashboard/StudentDashboard";
import "./index.css";

const Home = () => {
  const [showStudent, setShowStudent] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      title: "Smart Optimization",
      description:
        "Advanced algorithms automatically optimize schedules to minimize conflicts and maximize resource utilization.",
    },
    {
      title: "Real-Time Updates",
      description:
        "Instant synchronization across all platforms with live notifications for schedule changes and updates.",
    },
    {
      title: "Flexible Management",
      description:
        "Easy-to-use interface for both students and faculty with customizable views and preferences.",
    },
  ];

  const testimonials = [
    {
      text: "Flexsched has revolutionized how we manage our university timetables. The smart optimization feature saved us countless hours!",
      author: "Dr. Michael",
    },
    {
      text: "As a student, I love how easy it is to view my schedule and get real-time updates. The interface is intuitive and beautiful!",
      author: "Sarah Johnson",
    },
    {
      text: "Easy-to-use interface for both students and faculty with customizable views and preferences.",
      author: "Flexible Management",
    },
  ];

  return (
    <div>
      {!showStudent ? (
        <>
          {/* <Header onStudentClick={() => setShowStudent(true)} /> */}
          <Header />
          <FacultyLogin />

          <div className="bg-container w-100 d-flex flex-column align-items-center">
            <div style={{ height: "100px" }} />

            {/* Hero Section */}
            <section className="home-container text-center">
              <h1 className="home-heading p-3 heading">FlexSched</h1>
              <p className="home-description description">
                Experience intelligent timetable management with Flexsched's
                advanced scheduling system designed for modern educational
                institutions.
              </p>
              <div className="m-4 d-flex gap-3 justify-content-center">
                 <button
                  type="button"
                  className="btn get-btn"
                  onClick={() => navigate("/signup")} // ✅ navigate to signup
                >
                  Get Started
                </button>
                <button
                  type="button"
                  className="btn learn-btn"
                  onClick={() => navigate("/learn-more")} // ✅ navigate to Learn More page
                >
                  Learn More
                </button>
                <button
                  type="button"
                  className="btn developer-btn"
                  onClick={() => navigate("/developer")} // ✅ navigate to Developer page
                >
                  Developer
                </button>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
              <h1 className="feature-heading">Features</h1>
              <div className="features-container d-flex gap-3">
                {features.map((f, idx) => (
                  <div key={idx} className="features feature-card">
                    <h2>{f.title}</h2>
                    <p>{f.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Testimonials Section */}
            <section id="features" className="features-section">
              <h1 className="feature-heading">What Users Say</h1>
              <div className="features-container d-flex gap-3">
                {testimonials.map((t, idx) => (
                  <div key={idx} className={`features feature-card-${idx}`}>
                    <p>{t.text}</p>
                    <h3>{t.author}</h3>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <Footer />
        </>
      ) : (
        <StudentDashboard />
      )}
    </div>
  );
};

export default Home;
