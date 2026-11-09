import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "react-toastify";
import { LoginSchema, type LoginFormValues } from "../../Schema/loginSchema";
import AuthCard from "../../componat/AuthCard/AuthCard";
import { TextField } from "../../componat/fields/fields";
import { KeyIcon, UserIcon } from "../../componat/icons/icons";
import apiClient, { AUTH_TOKEN_KEY } from "../../serveses/apiClient";

export default function Login() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { login: "bahaaeddin", password: "Bahaa123$" },
    mode: "onBlur",
  });

  async function handleLogin(values: LoginFormValues) {
    try {
      const response = await apiClient.post("/users/signin", values);
      if (response.data?.success === true) {
        const token = response.data?.data?.token;
        if (typeof token === "string") localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem("route-posts-username", values.login);
        localStorage.setItem("route-posts-user-id", `local-${values.login.toLowerCase()}`);
        toast.success(response.data.message || "Login successful");
        navigate("/feed", { replace: true });
      } else {
        toast.error(response.data?.message || "Login failed");
      }
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "An error occurred during login"
          : "An error occurred during login",
      );
    }
  }

  return (
    <AuthCard title="Log in to Social" subtitle="Log in and continue your social journey.">
      <form className="space-y-3.5" onSubmit={handleSubmit(handleLogin)} noValidate>
        <TextField
          {...register("login")}
          icon={<UserIcon />}
          aria-label="Email or username"
          placeholder="Email or username"
          autoComplete="username"
          error={errors.login?.message}
        />
        <TextField
          {...register("password")}
          icon={<KeyIcon />}
          aria-label="Password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          error={errors.password?.message}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-[#00298d] text-sm font-bold text-white transition hover:bg-main disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
        <div className="pt-1 text-center">
          <Link to="/auth/login" className="text-xs font-medium text-[#00298d] hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
