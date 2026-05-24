import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RiGraduationCapFill } from "react-icons/ri";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { resetPassword } from "@/services/user-service";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="/images/login_img.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-50 dark:grayscale"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(19,127,236,0.45) 0%, rgba(16,25,34,0.8) 100%)",
          }}
        />
        <div className="absolute text-white inset-0 flex flex-col justify-center p-25 z-20">
          <div className="flex gap-3 font-bold items-center">
            <div className="bg-white w-10 h-10 flex items-center rounded-md justify-center">
              <RiGraduationCapFill className="text-2xl text-[#137FEC]" />
            </div>
            <p className="text-[22px]">EduSpace</p>
          </div>
          <div className="my-8 font-bold text-5xl">
            <p>Create a New</p>
            <p>Password.</p>
          </div>
          <p className="max-w-112.5 font-medium text-5 text-white/80 mb-10">
            Choose a strong password to secure your account.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#101922]">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            {success ? (
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl text-white font-bold">Password Reset</h1>
                <p className="text-[#94A3B8]">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-[#137FEC] border-none w-full py-3 rounded-md text-[18px] text-white hover:bg-[#137FEC]/90 font-semibold"
                >
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl text-white font-bold">Reset Password</h1>
                  <p className="text-[16px] text-[#94A3B8]">
                    Enter your new password below.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-white text-md font-medium">
                    New Password
                  </label>
                  <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5 relative">
                    <FaLock className="text-[#94A3B8]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                        {showPassword ? <FaEyeSlash className="text-white cursor-pointer" /> : <FaEye className="text-white cursor-pointer" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="confirm" className="text-white text-md font-medium">
                    Confirm Password
                  </label>
                  <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5 relative">
                    <FaLock className="text-[#94A3B8]" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white text-[18px] flex-1"
                      placeholder="********"
                      required
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-7 text-[#94A3B8] hover:text-white"
                      >
                        {showConfirm ? <FaEyeSlash className="text-white cursor-pointer" /> : <FaEye className="text-white cursor-pointer" />}
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="flex items-center justify-center bg-[#137FEC] border-none w-full py-6 cursor-pointer text-[18px] text-white hover:bg-[#137FEC]/90 font-semibold disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                <p className="text-center font-semibold text-[#94A3B8]">
                  <Link to="/login" className="text-[#137FEC] hover:text-[#137FEC]/90">
                    Back to Sign In
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
