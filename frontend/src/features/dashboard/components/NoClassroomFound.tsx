import React from "react";

const NoClassroomFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 relative">
      {/* Icon circle */}
      <div className="w-100 h-100 rounded-full flex items-center justify-center">
        <div className="w-100 h-100  rounded-xl flex items-center justify-center text-white text-3xl">
          <img
            src="/images/creativ.png"
            alt="No classroom"
            className="w-80 h-80 object-contain"
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-3">
        Ready to start your learning journey?
      </h2>

      {/* Description */}
      <p className="text-gray-500 max-w-md mb-8">
        You haven't joined or created any classes yet. Click the button below to
        get started and begin your educational adventure!
      </p>

      <div className="absolute right-13 -bottom-25">
        <img src="/images/arrow.png" alt="" className="w-40 h-40" />
      </div>
    </div>
  );
};

export default NoClassroomFound;
