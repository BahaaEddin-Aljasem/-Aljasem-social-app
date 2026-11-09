import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const base =
  "h-[46px] w-full rounded-xl border border-[#dce3ef] bg-[#f8fafc] pl-11 pr-3 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition focus:border-[#00298d] focus:bg-white " +
  "focus:ring-2 focus:ring-[#00298d]/15";

interface FieldShellProps {
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}

function FieldShell({ icon, error, children }: FieldShellProps) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="mt-1 pl-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { icon, error, className = "", ...props },
  ref,
) {
  return (
    <FieldShell icon={icon} error={error}>
      <input ref={ref} aria-invalid={!!error} className={`${base} ${className}`} {...props} />
    </FieldShell>
  );
});

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon: ReactNode;
  error?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { icon, error, children, className = "", ...props },
  ref,
) {
  return (
    <FieldShell icon={icon} error={error}>
      <select ref={ref} aria-invalid={!!error} className={`${base} pr-8 ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});
