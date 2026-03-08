// PeopleCardSkeleton.tsx
const PeopleCardSkeleton = ({ isLast = false }: { isLast?: boolean }) => {
  return (
    <div
      className={`flex justify-between items-center px-4 py-4 border-b border-[#d6dce4] ${isLast ? "border-b-0" : ""}`}
    >
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        {/* Name */}
        <div className="w-36 h-4 rounded-md bg-gray-200 animate-pulse" />
      </div>
      {/* Action icon */}
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
};

export default PeopleCardSkeleton;
