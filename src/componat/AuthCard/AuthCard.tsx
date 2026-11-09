import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-bold transition ${
    isActive ? "bg-white text-[#00298d] shadow-[0_1px_4px_rgba(15,30,80,0.18)]" : "text-slate-600 hover:text-[#00298d]"
  }`;

interface AuthCardProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(20,40,120,0.1)]">
      <div className="flex gap-1 rounded-xl bg-[#eff3fb] p-1">
        <NavLink to="/auth/login" className={tab}>
          Login
        </NavLink>
        <NavLink to="/auth/register" className={tab}>
          Register
        </NavLink>
      </div>
      <h2 className="mt-5 text-[28px] font-bold leading-tight text-[#0b1530]">{title}</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">{subtitle}</p>
      {children}
    </div>
  );
}
