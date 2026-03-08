import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { MdOutlineMailOutline } from "react-icons/md";
const PeopleCard = (user: any) => {
  return (
    <div className="flex justify-between items-center mt-4 px-3">
      <div className="flex gap-6">
        <Avatar size={"2xl"}>
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn"
            className="grayscale"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div>
          <h3>adem{user.userName}</h3>
          <p></p>
        </div>
      </div>
      <MdOutlineMailOutline size={22} className="text-[#94A3B8]" />
    </div>
  );
};

export default PeopleCard;
