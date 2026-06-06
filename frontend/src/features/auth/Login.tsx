import { RiGraduationCapFill } from "react-icons/ri";
import { LoginForm } from "./components/login-form";
import { login } from "@/services/user-service";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      setError("");
      const res = await login(data, data.rememberMe);
      if (res.token) {
        navigate("/");
      }
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg === "Account is not active") {
        setError("Your account is not verified. Please check your email.");
      } else {
        setError(msg || "Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Image */}
      <div className="hidden lg:block relative">
        <img
          src="/images/login_img.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-50 dark:grayscale"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(19,127,236,0.45) 0%, rgba(16,25,34,0.8) 100%)`,
          }}
        ></div>

        <div className="absolute text-white inset-0 flex flex-col justify-center p-25 z-20">
          <div className="flex gap-3 font-bold items-center">
            <div className="bg-white w-10 h-10 flex items-center rounded-md justify-center">
              <RiGraduationCapFill className="text-2xl text-[#137FEC]" />
            </div>
            <p className="text-[22px]">EduSpace</p>
          </div>
          <div className="my-8 font-bold text-5xl">
            <p>Elevate Your</p>
            <p>Learning Journey.</p>
          </div>
          <p className="max-w-112.5 font-medium text-5 text-white/80 mb-10">
            Join thousands of students and educators worldwide on the most
            advanced LMS built for the modern classroom.
          </p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#101922]">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginForm onSubmit={handleLogin} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
