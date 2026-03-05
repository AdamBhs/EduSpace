import { Input } from "@/shared/components/ui/input";
import { IoIosSearch } from "react-icons/io";

const SearchInput = () => {
  return (
    <div
      className="flex items-center max-w-60 border-gray-200 border rounded-md pl-2 mt-4 ml-0.5"
      style={{ boxShadow: "0 0px 2px rgba(211, 211, 211, 5)" }}
    >
      <IoIosSearch size={22} className="cursor-pointer" />
      <Input
        className="border-none shadow-none"
        type="text"
        placeholder="Search..."
      />
    </div>
  );
};

export default SearchInput;
