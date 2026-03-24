import { FaFileLines } from "react-icons/fa6";
import { GoDotFill } from "react-icons/go";
const CardContent = () => {
  return (
    <div
      className="flex items-center gap-8 py-4 px-4 mt-2 border border-[#E2E8F0] rounded-lg ml-px cursor-pointer hover:bg-[#E2E8F0]/25"
      style={{ boxShadow: "0 0px 1px rgba(211, 211, 211, 5)" }}
    >
      <div className="w-10 h-10 flex items-center justify-center bg-[#137FEC]/10 rounded-full text-[#2563EB]">
        <FaFileLines size={18} />
      </div>
      <div className="flex items-center w-full justify-between">
        <div>
          <h3 className="text-[#0F172A] text-[16px]">
            Course Syllabus & Expectations
          </h3>
          <p className="flex items-center gap-0.5 text-[12px] font-mono text-[#64748B]">
            Posted Oct 12 <GoDotFill size={10} className="pb-0.5" /> Material
          </p>
        </div>
        <div className="px-3 py-1 bg-[#64748B]/10 text-[#64748B] rounded-[50px] text-[12px]">
          References
        </div>
      </div>
    </div>
  );
};

export default CardContent;
