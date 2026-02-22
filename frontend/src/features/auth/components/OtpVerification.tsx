import { Field } from "@/shared/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export function OtpVerification() {
  return (
    <Field className="w-fit">
      <InputOTP id="digits-only" maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
        <InputOTPGroup className="gap-2">
          <InputOTPSlot
            index={0}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
          <InputOTPSlot
            index={1}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
          <InputOTPSlot
            index={2}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
          <InputOTPSlot
            index={3}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
          <InputOTPSlot
            index={4}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
          <InputOTPSlot
            index={5}
            className="w-12 h-12 text-xl border border-[#838e9f] rounded-lg text-center focus:outline-none"
          />
        </InputOTPGroup>
      </InputOTP>
    </Field>
  );
}
