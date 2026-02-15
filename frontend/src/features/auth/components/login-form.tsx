import { cn } from "@/shared/lib/utils";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
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
              className="border-none bg-[#0F172A] placeholder:text-[#475569] placeholder:text-[16px] text-white text-[18px] flex-1"
              placeholder="********"
              required
            />

            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#94A3B8] hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
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
  );
}
