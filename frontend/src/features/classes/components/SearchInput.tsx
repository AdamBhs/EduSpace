import { Input } from "@/shared/components/ui/input";
import { IoIosSearch } from "react-icons/io";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) => {
  return (
    <div className="flex items-center max-w-60 border-gray-200 border rounded-md pl-2 mt-4 ml-0.5 focus-within:shadow-[0_0px_4px_rgba(19,127,236,0.4)] transition-shadow duration-200">
      <IoIosSearch size={22} className="cursor-pointer" />
      <Input
        className="border-none shadow-none"
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
