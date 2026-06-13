import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { FaAt, FaLock, FaEyeSlash, FaEye } from "react-icons/fa";
import { useState } from "react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Link } from "react-router-dom";



export function LoginForm({ className, onSubmit, error, ...props }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ email, password, rememberMe });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl text-white font-bold">Welcome Back</h1>
          <p className="text-[16px] text-balance text-[#94A3B8]">
            Please enter your details to sign in to your account.
          </p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <Link to="/forgot-password" className="text-[#137FEC] cursor-pointer hover:underline">
                Forgot password?
              </Link>
            </div>
          </FieldLabel>

          <div className="flex items-center border border-[#728298] rounded-md px-3 py-1.5 relative">
            <FaLock className="text-[#94A3B8]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length <= 0) setShowPassword(false);
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
                  <FaEyeSlash className="text-white cursor-pointer" />
                ) : (
                  <FaEye className="text-white cursor-pointer" />
                )}
              </button>
            )}
          </div>
        </Field>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="bg-[#1E293B] border-[#728298] cursor-pointer w-4.5 h-4.5"
          />
          <p className="text-[#94A3B8] mt-[1.5px]">Keep me signed in</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-[#137FEC] border-none w-full py-6 cursor-pointer text-[18px] text-white hover:bg-[#137FEC]/90 font-semibold disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
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
  );
}
