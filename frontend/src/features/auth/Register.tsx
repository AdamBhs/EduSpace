import { RiGraduationCapFill } from "react-icons/ri";

const Register = () => {
  const features = [
    "Collaborative virtual classrooms",
    "AI-powered grading assistance",
    "Advanced progress analytics",
  ];
  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#101922]">
      <div className="absolute -top-25 -left-25 w-80 h-80 rounded-full bg-[#0d1b28] shadow-[0_0_200px_80px_rgba(16,30,43, 0.8)]"></div>

      <div className="flex">
        <div>
          <div className="flex gap-3 font-bold items-center">
            <div className="bg-[#137FEC] w-10 h-10 flex items-center rounded-md justify-center">
              <RiGraduationCapFill className="text-2xl text-white" />
            </div>
            <p className="text-[26px] mt-1 text-white">EduSpace</p>
          </div>
          <h1 className="text-[36px] font-bold text-white mt-6 mb-4 leading-10">
            Elevate your <br />
            <span className="text-[#137FEC]">
              learning <br /> experience
            </span>{" "}
            today.
          </h1>
          <p className="font-lexend text-[#94A3B8] max-w-88.5 text-lg">
            Join over 2 million students and educators worldwide on the most
            advanced learning management system.
          </p>
          <div className="space-y-4 mt-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-200 text-lg font-medium mt-1">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
