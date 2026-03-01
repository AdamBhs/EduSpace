import { Field } from "@/shared/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface OtpVerificationProps {
  onChange: (value: string) => void;
}

export function OtpVerification({ onChange }: OtpVerificationProps) {
  return (
    <Field className="w-fit">
      <InputOTP
        id="digits-only"
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onChange={onChange}
      >
        <InputOTPGroup className="gap-2">
          {[...Array(6)].map((_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </Field>
  );
}
