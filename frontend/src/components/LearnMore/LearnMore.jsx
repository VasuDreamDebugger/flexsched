import React from "react";
import { Link } from "react-router-dom";
import "./LearnMore.css";

const LearnMore = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-6 text-blue-600">About FlexSched</h1>

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">What is FlexSched?</h2>
        <p className="text-gray-700">
          FlexSched is a modern scheduling platform for colleges, designed to
          simplify the management and viewing of class timetables. Instead of
          static PDFs or charts, FlexSched connects to a live database so that
          students and faculty always have access to the latest schedules.
        </p>
      </section>

      {/* Why FlexSched */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Why FlexSched?</h2>
        <p className="text-gray-700">
          Managing timetables can be frustrating when updates happen frequently.
          FlexSched solves this problem by making timetable updates instant,
          centralized, and accessible anywhere. No more outdated charts pinned
          on notice boards!
        </p>
      </section>

      {/* Who is it for */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Who is it for?</h2>
        <p className="text-gray-700">
          <strong>Students:</strong> Can view updated timetables in real-time
          without logging in.<br />
          <strong>Faculty:</strong> Can securely log in to manage schedules and
          make updates instantly.
        </p>
      </section>

      {/* Benefits */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Benefits</h2>
        <ul className="list-disc text-left max-w-xl mx-auto text-gray-700 space-y-2">
          <li>Always up-to-date timetables for students.</li>
          <li>Faculty can manage their schedules with ease.</li>
          <li>Reduces errors caused by manual updates.</li>
          <li>Accessible on any device, anywhere.</li>
        </ul>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Key Features</h2>
        <ul className="list-disc text-left max-w-xl mx-auto text-gray-700 space-y-2">
          <li>Dynamic timetable display from MongoDB.</li>
          <li>Secure sign-up & login system for faculty.</li>
          <li>Simple, read-only timetable access for students.</li>
          <li>Centralized database for consistent schedules.</li>
        </ul>
      </section>

      {/* Process */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">How it Works</h2>
        <ol className="list-decimal text-left max-w-xl mx-auto text-gray-700 space-y-2">
          <li>Faculty sign up or log in.</li>
          <li>Faculty add or update class schedules.</li>
          <li>Schedules are stored in MongoDB.</li>
          <li>Students instantly view the updated timetable.</li>
        </ol>
      </section>

      {/* Tech Stack */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Technology Stack</h2>
        <p className="text-gray-700">
          <strong>Frontend:</strong> React (Vite, Tailwind CSS) <br />
          <strong>Backend:</strong> Node.js + Express <br />
          <strong>Database:</strong> MongoDB Atlas <br />
          <strong>Hosting:</strong> Netlify / Render / Heroku
        </p>
      </section>

      {/* Future Enhancements */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Future Enhancements</h2>
        <ul className="list-disc text-left max-w-xl mx-auto text-gray-700 space-y-2">
          <li>Faculty dashboards with personal timetable view.</li>
          <li>Notification system for timetable changes.</li>
          <li>Integration with Google Calendar.</li>
          <li>Dedicated mobile application for quick access.</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">FAQ</h2>
        <div className="text-left max-w-xl mx-auto text-gray-700 space-y-4">
          <p><strong>Q:</strong> Do students need to log in?<br />
          <strong>A:</strong> No. Students can directly view the timetable.</p>

          <p><strong>Q:</strong> Who can update timetables?<br />
          <strong>A:</strong> Only registered faculty can update schedules.</p>

          <p><strong>Q:</strong> Where is the data stored?<br />
          <strong>A:</strong> In a secure MongoDB cloud database.</p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-6">
        <Link
          to="/"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LearnMore;
