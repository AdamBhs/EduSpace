import { MdPictureAsPdf } from "react-icons/md";

const CardFile = () => {
  return (
    <div className="p-4.25 border-[#E2E8F0] border-2 w-max rounded-lg cursor-pointer hover:opacity-85">
      <div className="flex items-center justify-center mb-4.5 px-16.25 py-6.5 bg-[#FEF2F2] text-[#EF4444] rounded-md">
        <MdPictureAsPdf size={30} />
      </div>
      <h3 className="text-[#1E293B] text-[14px]">Cell_Structure.pdf</h3>
      <p className="text-[#64748B] text-[12px]">Uploaded 2h ago</p>
    </div>
  );
};

export default CardFile;
