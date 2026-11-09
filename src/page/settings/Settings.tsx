import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { ChangePasswordSchema, type ChangePasswordFormValues } from "../../Schema/changePasswordSchema";
import { changePassword } from "../../serveses/profileApi";

export default function Settings() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: "onBlur",
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword(values);
      toast.success("Password updated successfully");
      reset();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Failed to update password";
      toast.error(message);
    }
  }

  return (
    <section className="rounded-2xl border border-[#dfe6f1] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-11 place-items-center rounded-full bg-[#e8f1ff] text-[#1877f2]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none">
            <circle cx="8.5" cy="13.5" r="2.8" stroke="currentColor" strokeWidth="1.8" />
            <path d="m11 11 2.2-2.2a2.8 2.8 0 0 1 3.9 3.9L13 16.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14.6 7.4 16.7 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-[38px] font-bold leading-none text-[#0f2348]">Change Password</h1>
          <p className="mt-1 text-sm text-slate-500">Keep your account secure by using a strong password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="currentPassword" className="mb-2 block text-sm font-semibold text-[#1f2b45]">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            placeholder="Enter current password"
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-[#f8fbff] px-4 text-sm text-slate-800 outline-none transition focus:border-[#1877f2]"
            {...register("currentPassword")}
          />
          {errors.currentPassword?.message && (
            <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-[#1f2b45]">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-[#f8fbff] px-4 text-sm text-slate-800 outline-none transition focus:border-[#1877f2]"
            {...register("newPassword")}
          />
          <p className="mt-1 text-xs text-[#64748b]">At least 8 characters with uppercase, lowercase, number, and special character.</p>
          {errors.newPassword?.message && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmNewPassword" className="mb-2 block text-sm font-semibold text-[#1f2b45]">
            Confirm new password
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            placeholder="Re-enter new password"
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-[#f8fbff] px-4 text-sm text-slate-800 outline-none transition focus:border-[#1877f2]"
            {...register("confirmNewPassword")}
          />
          {errors.confirmNewPassword?.message && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl bg-[#68a2f2] text-sm font-bold text-white transition hover:bg-[#4f91ee] disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}

