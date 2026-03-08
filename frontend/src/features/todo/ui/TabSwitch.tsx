import { useState } from "react";

type Tab = "Assigned" | "Done";

const TabSwitch = () => {
  const [active, setActive] = useState<Tab>("Assigned");

  const toggle = () =>
    setActive((prev) => (prev === "Assigned" ? "Done" : "Assigned"));

  return (
    <div
      onClick={toggle}
      className="relative flex items-center bg-[#edeef4] rounded-lg p-1 w-fit cursor-pointer hover:shadow-[0_0px_4px_rgba(19,127,236,0.4)]"
    >
      {/* Sliding background */}
      <div
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
        style={{
          width: "calc(50% - 4px)",
          transform:
            active === "Assigned"
              ? "translateX(0%)"
              : "translateX(calc(100% - 2px))",
        }}
      />

      <div
        className={`relative z-10 px-5 py-1 text-center text-sm font-medium select-none transition-colors duration-300 ${active === "Assigned" ? "text-[#137FEC]" : "text-gray-400"}`}
      >
        Assigned
      </div>
      <div
        className={`relative z-10 px-5 py-1 w-27.5 text-center text-sm font-medium select-none transition-colors duration-300 ${active === "Done" ? "text-[#137FEC]" : "text-gray-400"}`}
      >
        Done
      </div>
    </div>
  );
};

export default TabSwitch;
