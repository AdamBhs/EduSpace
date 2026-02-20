import { RiGraduationCapFill } from "react-icons/ri";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { FaGoogle, FaAt, FaLock, FaEyeSlash, FaEye } from "react-icons/fa";
import { useState } from "react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Link } from "react-router-dom";

const Register = () => {
  const features = [
    "Collaborative virtual classrooms",
    "AI-powered grading assistance",
    "Advanced progress analytics",
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#101922]">
      <div className="absolute -top-25 -left-25 w-80 h-80 rounded-full bg-[#0d1b28] shadow-[0_0_200px_80px_rgba(16,30,43, 0.8)]"></div>

      <div className="flex gap-10 w-full mx-100 items-center">
        <div>
          <div className="flex gap-3 font-bold items-center">
            <div className="bg-[#137FEC] w-10 h-10 flex items-center rounded-md justify-center">
              <RiGraduationCapFill className="text-2xl text-white" />
            </div>
            <p className="text-[26px] mt-1 text-white">EduSpace</p>
          </div>
          <h1 className="text-[36px] font-bold text-white mt-6 mb-4 leading-10">
            Elevate your <br />
            <span className="text-[#137FEC]">
              learning <br /> experience
            </span>{" "}
            today.
          </h1>
          <p className="font-lexend text-[#94A3B8] max-w-88.5 text-lg">
            Join over 2 million students and educators worldwide on the most
            advanced learning management system.
          </p>
          <div className="space-y-4 mt-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-200 text-lg font-medium mt-1">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0f1827] border border-[#253246] w-120 p-10 rounded-lg shadow-2xl">
          <form>
            <FieldGroup>
              <div className="flex items-center">
                <div className="flex flex-col w-max gap-1">
                  <div className="w-10 h-10 rounded-full border border-white/50 bg-[#137FEC] text-white flex justify-center items-center text-[20px] pt-0.5 font-bold">
                    1
                  </div>
                  <p className="text-[#137FEC] text-center text-[14px] font-semibold">
                    Role
                  </p>
                </div>
                <FieldSeparator className="w-[50%] mb-5"></FieldSeparator>
                <FieldSeparator className="w-[50%] mb-5"></FieldSeparator>
                <div className="flex flex-col w-max gap-1">
                  <div className="w-10 h-10 rounded-full border border-white/50 bg-[#137FEC] text-white flex justify-center items-center text-[20px] pt-0.5 font-bold">
                    1
                  </div>
                  <p className="text-[#137FEC] text-center text-[14px] font-semibold">
                    Role
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl text-white font-bold">Welcome Back</h1>
                <p className="text-[16px] text-balance text-[#94A3B8]">
                  Please enter your details to sign in to your account.
                </p>
              </div>

              <div>
                <Button className="flex items-center justify-center bg-transparent border-2 border-[#728298] w-full py-6 cursor-pointer text-[18px] font-semibold">
                  <FaGoogle className="mb-0.5" />
                  Google
                </Button>
              </div>
              <div className="flex items-center ">
                <div className="grow border-t border-[#364358]"></div>

                <span className="mx-4 text-[#94A3B8] text-sm">Or Email</span>

                <div className="grow border-t border-[#364358]"></div>
              </div>
              <Field className="gap-1">
                <FieldLabel htmlFor="email" className="text-white text-md">
                  Email
                </FieldLabel>
                <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5">
                  <FaAt className="text-[#94A3B8]" />
                  <Input
                    id="email"
                    type="email"
                    className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </Field>
              <Field className="gap-1">
                <FieldLabel htmlFor="password" className="text-white text-md">
                  <div className="flex justify-between w-full">
                    <p>Password</p>
                    {/* TODO: Change it to reset password */}
                    <p className="text-[#137FEC] cursor-pointer hover:underline">
                      Forget password?
                    </p>
                  </div>
                </FieldLabel>

                <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5 relative">
                  <FaLock className="text-[#94A3B8]" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.length <= 0) {
                        setShowPassword(false);
                      }
                    }}
                    className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white text-[18px] flex-1"
                    placeholder="********"
                    required
                  />

                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-7 text-[#94A3B8] hover:text-white"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-white" />
                      ) : (
                        <FaEye className="text-white" />
                      )}
                    </button>
                  )}
                </div>
              </Field>

              <div className="flex items-center gap-2">
                <Checkbox className="bg-[#1E293B] border-[#728298] cursor-pointer w-4.5 h-4.5" />
                <p className="text-[#94A3B8] mt-[1.5px]">Keep me signed in</p>
              </div>
              <Field>
                <Button className="flex items-center justify-center bg-[#137FEC] border-none  w-full py-6 cursor-pointer text-[18px] text-white hover:bg-[#137FEC]/90 font-semibold">
                  Sign In
                </Button>
              </Field>
              <Field>
                <FieldDescription className="text-center font-semibold text-[#94A3B8]">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#137FEC] hover:text-[#137FEC]/90"
                  >
                    Create an account
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
