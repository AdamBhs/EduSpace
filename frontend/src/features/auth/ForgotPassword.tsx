import { useState } from "react";
import { Link } from "react-router-dom";
import { RiGraduationCapFill } from "react-icons/ri";
import { FaAt } from "react-icons/fa";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { requestPasswordReset } from "@/services/user-service";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send reset email. Please try again.");
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
            <p>Reset Your</p>
            <p>Password.</p>
          </div>
          <p className="max-w-112.5 font-medium text-5 text-white/80 mb-10">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#101922]">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            {sent ? (
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl text-white font-bold">Check Your Email</h1>
                <p className="text-[#94A3B8]">
                  We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Check your inbox and follow the instructions.
                </p>
                <p className="text-[#94A3B8] text-sm">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="text-[#137FEC] hover:underline cursor-pointer"
                  >
                    Try again
                  </button>
                </p>
                <Link
                  to="/login"
                  className="text-[#137FEC] hover:underline text-sm font-semibold"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl text-white font-bold">Forgot Password</h1>
                  <p className="text-[16px] text-[#94A3B8]">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-white text-md font-medium">
                    Email
                  </label>
                  <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5">
                    <FaAt className="text-[#94A3B8]" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center justify-center bg-[#137FEC] border-none w-full py-6 cursor-pointer text-[18px] text-white hover:bg-[#137FEC]/90 font-semibold disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center font-semibold text-[#94A3B8]">
                  Remember your password?{" "}
                  <Link to="/login" className="text-[#137FEC] hover:text-[#137FEC]/90">
                    Sign In
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
