// PeopleSkeleton.tsx
import PeopleCardSkeleton from "./PeopleCardSkeleton";

const PeopleSkeleton = () => {
  return (
    <div className="px-68 pt-9">
      {/* Header */}
      <div className="flex justify-between w-full">
        <div className="w-24 h-7 rounded-md bg-gray-200 animate-pulse" />
        <div className="w-32 h-9 rounded-[50px] bg-gray-200 animate-pulse" />
      </div>

      {/* Teachers Section */}
      <div className="mt-6">
        <div className="w-24 h-5 rounded-md bg-gray-200 animate-pulse mb-3 pb-2 border-b border-transparent" />
        <div className="bg-[#f9f9f9] rounded-lg border border-[#d6dce4]">
          <PeopleCardSkeleton isLast />
        </div>
      </div>

      {/* Students Section */}
      <div className="mt-10">
        <div className="w-32 h-5 rounded-md bg-gray-200 animate-pulse mb-4" />

        {/* Search + Sort bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="w-52 h-9 rounded-md bg-gray-200 animate-pulse" />
          <div className="w-44 h-9 rounded-md bg-gray-200 animate-pulse" />
        </div>

        {/* Student cards */}
        <div className="bg-[#f9f9f9] rounded-lg border border-[#d6dce4] mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <PeopleCardSkeleton key={i} isLast={i === 4} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeopleSkeleton;
