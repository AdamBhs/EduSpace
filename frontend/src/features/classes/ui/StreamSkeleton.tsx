const StreamSkeleton = () => {
  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col  pb-4">
        {/* Nav tabs skeleton */}
        <div className="flex gap-6 border-b border-[#E2E8F0] pb-3 pt-3 pl-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-20 animate-pulse rounded-full bg-[#E2E8F0]"
            />
          ))}
        </div>

        <div className="px-75 flex flex-col pt-16 h-screen overflow-y-auto">
          {/* Hero banner skeleton */}
          <div className="h-50 w-full animate-pulse rounded-3xl bg-[#E2E8F0]"></div>

          <div className="flex gap-6 mt-6">
            {/* Left sidebar skeleton */}
            <div className="w-63.5 flex flex-col gap-4">
              {/* Upcoming Work card */}
              <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#E2E8F0]" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="h-3 w-32 animate-pulse rounded-full bg-[#E2E8F0]" />
                    <div className="h-3.5 w-44 animate-pulse rounded-full bg-[#E2E8F0]" />
                  </div>
                ))}
                <div className="h-3 w-16 animate-pulse rounded-full bg-[#E2E8F0]" />
              </div>

              {/* Class Code card */}
              <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
                <div className="h-3.5 w-20 animate-pulse rounded-full bg-[#E2E8F0]" />
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-[#E2E8F0]" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#E2E8F0]" />
                </div>
              </div>
            </div>

            {/* Right feed skeleton */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Post composer skeleton */}
              <div className="w-full p-4 flex gap-4 border border-[#E2E8F0] rounded-lg h-18 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#E2E8F0]" />
                  <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E2E8F0]" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#E2E8F0]" />
              </div>

              {/* Post cards skeleton */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#E2E8F0] bg-white p-6 flex flex-col gap-4"
                >
                  {/* Author row */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-[#E2E8F0]" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#E2E8F0]" />
                      <div className="h-3 w-20 animate-pulse rounded-full bg-[#E2E8F0]" />
                    </div>
                  </div>

                  {/* Body lines */}
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-full animate-pulse rounded-full bg-[#E2E8F0]" />
                    <div className="h-3 w-[90%] animate-pulse rounded-full bg-[#E2E8F0]" />
                    <div className="h-3 w-[65%] animate-pulse rounded-full bg-[#E2E8F0]" />
                  </div>

                  {/* Link attachment (second card only) */}
                  {i === 1 && (
                    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 flex items-center gap-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-[#E2E8F0] flex-shrink-0" />
                      <div className="h-3 w-48 animate-pulse rounded-full bg-[#E2E8F0]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StreamSkeleton;
