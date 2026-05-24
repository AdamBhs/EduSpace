import { Link } from "react-router-dom";
import { RiGraduationCapFill } from "react-icons/ri";
import { BookOpen, Users, MessageSquare, BarChart3, Calendar, Bell } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Course Materials",
    description: "Organize lectures, TDs, TPs, and summaries into chapters. Share study materials with your class instantly.",
  },
  {
    icon: Users,
    title: "Classroom Management",
    description: "Create teaching or study-group classrooms. Manage members, assign roles, and collaborate with ease.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Built-in group chat with typing indicators, file sharing, and online presence for every classroom.",
  },
  {
    icon: BarChart3,
    title: "Grades & Assignments",
    description: "Create assignments with due dates, collect submissions, grade work, and track progress with a full grade table.",
  },
  {
    icon: Calendar,
    title: "Calendar & To-Do",
    description: "See all assignment due dates on a calendar view. Track pending and completed work in your personal to-do list.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Stay informed with real-time notifications for new posts, grades, comments, and classroom updates.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-16 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#137FEC] w-9 h-9 flex items-center rounded-lg justify-center">
            <RiGraduationCapFill className="text-xl text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">
            EduSpace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-white bg-[#137FEC] hover:bg-[#1171d4] px-5 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-16 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#137FEC] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <RiGraduationCapFill className="text-sm" />
          Built for University Classrooms
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#0F172A] leading-tight">
          Your Digital
          <br />
          <span className="text-[#137FEC]">Classroom Space</span>
        </h1>
        <p className="mt-6 text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          Manage courses, share materials, assign work, chat with your class, and
          track grades — all in one platform designed for students and teachers.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/register"
            className="text-base font-semibold text-white bg-[#137FEC] hover:bg-[#1171d4] px-8 py-3 rounded-lg transition-colors shadow-lg shadow-[#137FEC]/25"
          >
            Create Account
          </Link>
          <Link
            to="/login"
            className="text-base font-semibold text-[#334155] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-8 py-3 rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-16 py-16 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] text-center mb-3">
            Everything You Need
          </h2>
          <p className="text-[#64748B] text-center mb-12 max-w-lg mx-auto">
            A complete classroom platform with tools for teaching, learning, and collaboration.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:border-[#137FEC]/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#137FEC]" />
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-16 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-[#64748B] mb-8">
            Join EduSpace today and transform how you teach and learn.
          </p>
          <Link
            to="/register"
            className="inline-block text-base font-semibold text-white bg-[#137FEC] hover:bg-[#1171d4] px-10 py-3.5 rounded-lg transition-colors shadow-lg shadow-[#137FEC]/25"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-6 border-t border-[#E2E8F0] text-center">
        <p className="text-sm text-[#94A3B8]">
          EduSpace — University Classroom Management Platform
        </p>
      </footer>
    </div>
  );
}
