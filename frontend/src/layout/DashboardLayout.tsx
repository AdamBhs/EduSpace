import Navbar from "@/shared/components/Navbar";
import Sidebar from "@/shared/components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-2 bg-[#f3f3f3]">
          <div className="bg-white h-[calc(100vh-60px-16px)] px-6 py-5 rounded-2xl shadow-md overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
