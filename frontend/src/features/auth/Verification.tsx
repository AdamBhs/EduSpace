import { RiGraduationCapFill } from "react-icons/ri";
import { IoMailUnreadOutline } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { OtpVerification } from "./components/OtpVerification";
import { Button } from "@/shared/components/ui/button";
import { FaArrowLeft } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { resendCode, verifyCode } from "@/services/user-service";

const Verification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const { email } = location.state || {};

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(true);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (data: { email: String; code: any }) => {
    const res = await verifyCode(data);
    if (res) {
      navigate("/login");
    }
    return res;
  };

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!canResend || resending) return;

    try {
      setResending(true);
      await resendCode(email);
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      console.error("Failed to resend code:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex pt-20 items-center w-full h-screen bg-[#101922] flex-col text-white gap-8">
      <div className="flex gap-3 font-bold items-center">
        <div className="bg-[#137FEC] w-10 h-10 flex items-center rounded-md justify-center">
          <RiGraduationCapFill className="text-2xl text-white" />
        </div>
        <p className="text-[26px] mt-1 text-white">EduSpace</p>
      </div>

      <div className="bg-[#0F172A] border-2 border-[#283346] px-10 py-8 rounded-lg max-w-114.5 flex flex-col items-center gap-5 shadow-2xl">
        <div className="p-6 rounded-full bg-[#182744]">
          <IoMailUnreadOutline className="text-[#1D76E8] text-5xl" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[32px] font-bold">Verify your email</h1>
          <p className="text-[#94A3B8] text-[18px]">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold">{email}</p>
        </div>

        <OtpVerification onChange={setCode} />

        <Button
          className="bg-[#1D76E8] cursor-pointer w-full font-semibold py-5 text-md"
          onClick={() => handleSubmit({ email, code })}
        >
          Verify & Proceed
        </Button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[#94A3B8]">
            <p>Didn't receive the code?</p>
            {canResend ? (
              <span
                onClick={handleResend}
                className={`text-[#155ebc] font-semibold ml-1 cursor-pointer hover:underline ${resending ? "opacity-50 pointer-events-none" : ""}`}
              >
                {resending ? "Sending..." : "Resend"}
              </span>
            ) : (
              <span className="text-[#155ebc] ml-1 font-semibold">
                Resend{" "}
                <span className="text-[#155ebc]">
                  (00:{timer > 10 ? timer : "0" + timer})
                </span>
              </span>
            )}
          </div>

          <p
            className="text-[#94A3B8] flex items-center justify-center gap-1 mt-4 hover:underline cursor-pointer"
            onClick={() => navigate("/register")}
          >
            <FaArrowLeft /> Back to registration
          </p>
        </div>
      </div>

      <p className="text-[#64748B] text-[12px] max-w-100 text-center">
        By verifying your account, you agree to our{" "}
        <span className="underline cursor-pointer">Terms of Service</span> and{" "}
        <span className="underline cursor-pointer">Privacy Policy.</span>{" "}
        EduSpace uses industry standard encryption to protect your data.
      </p>
    </div>
  );
};

export default Verification;
