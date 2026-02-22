import { RiGraduationCapFill } from "react-icons/ri";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { FaLock, FaEyeSlash, FaEye, FaAt } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "@/services/user-service";
import { PasswordPopover } from "./components/PasswordPopover";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const features = [
    "Collaborative virtual classrooms",
    "AI-powered grading assistance",
    "Advanced progress analytics",
  ];
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC+1");

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(passwordRules).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      timezone,
    };

    try {
      const result = await register(userData);
      console.log(result);

      if (result?.success) {
        navigate("/verification", {
          state: { email: email },
        });
      }
    } catch (err) {
      console.log("Failed to register:", err);
    }
  };

  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#101922]">
      <div className="absolute -top-25 -left-25 w-80 h-80 rounded-full bg-[#0d1b28] shadow-[0_0_200px_80px_rgba(16,30,43, 0.8)]"></div>

      <div className="flex gap-10 w-full mx-100 items-center">
        {/* LEFT SIDE */}
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

        {/* RIGHT SIDE */}
        <div className="bg-[#0f1827] border border-[#253246] w-120 p-10 rounded-lg shadow-2xl">
          <form onSubmit={handleRegister}>
            <FieldGroup>
              <div className="flex flex-col gap-1 text-center">
                <h1 className="text-2xl text-white font-bold">
                  Create your account
                </h1>
                <p className="text-[16px] text-[#94A3B8]">
                  First, choose how you will use EduSpace
                </p>
              </div>

              {/* FIRST NAME & LAST NAME */}
              <Field className="gap-1">
                <div className="flex gap-5">
                  <div className="flex-1">
                    <FieldLabel
                      htmlFor="firstName"
                      className="text-white text-md mb-1"
                    >
                      First Name
                    </FieldLabel>
                    <div className="flex items-center border border-[#728298] rounded-md px-2 py-0.5">
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white flex-1"
                        placeholder="Mahmoud"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <FieldLabel
                      htmlFor="lastName"
                      className="text-white text-md mb-1"
                    >
                      Last Name
                    </FieldLabel>
                    <div className="flex items-center border border-[#728298] rounded-md px-2 py-0.5">
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white flex-1"
                        placeholder="Mostafa"
                        required
                      />
                    </div>
                  </div>
                </div>
              </Field>

              {/* EMAIL */}
              <Field className="gap-1">
                <FieldLabel htmlFor="email" className="text-white text-md">
                  Email Address
                </FieldLabel>
                <div className="flex items-center border border-[#728298] rounded-md px-2 py-0.5">
                  <FaAt className="text-[#94A3B8]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-none bg-[#0F172A] text-white flex-1"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </Field>

              {/* PASSWORD */}
              <Field className="gap-1">
                <FieldLabel htmlFor="password" className="text-white text-md">
                  Password
                </FieldLabel>

                <div className="relative">
                  <div className="flex items-center border border-[#728298] rounded-md px-2 py-0.5">
                    <FaLock className="text-[#94A3B8]" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="border-none bg-[#0F172A] text-white text-[18px] flex-1"
                      placeholder="********"
                      required
                    />

                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="right-7 text-[#94A3B8] hover:text-white"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    )}
                  </div>

                  {/* Floating popover */}
                  <PasswordPopover
                    password={password}
                    show={passwordFocused && password.length > 0}
                  />
                </div>
              </Field>

              {/* BUTTON */}
              <Field>
                <Button
                  type="submit"
                  disabled={!isValid}
                  className={`flex items-center justify-center w-full py-6 text-[18px] font-semibold text-white
                  ${
                    isValid
                      ? "bg-[#137FEC] hover:bg-[#137FEC]/90"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  Create Account
                </Button>
              </Field>

              <Field>
                <FieldDescription className="text-center font-semibold text-[#94A3B8]">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#137FEC] hover:text-[#137FEC]/90"
                  >
                    Log in
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
