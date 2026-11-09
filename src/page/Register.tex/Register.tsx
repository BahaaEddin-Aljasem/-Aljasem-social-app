import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "react-toastify";
import { RegisterSchema, type RegisterFormValues } from "../../Schema/register.Schema";
import AuthCard from "../../componat/AuthCard/AuthCard";
import { SelectField, TextField } from "../../componat/fields/fields";
import { AtIcon, CalendarIcon, KeyIcon, UserIcon, UsersIcon } from "../../componat/icons/icons";
import apiClient, { AUTH_TOKEN_KEY } from "../../serveses/apiClient";

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      Name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: RegisterFormValues) {
    const { Name, username, ...rest } = values;
    const payload = { ...rest, name: Name, ...(username ? { username } : {}) };
    try {
      const response = await apiClient.post("/users/signup", payload);
      if (response.data?.success === true) {
        const token = response.data?.data?.token;
        if (typeof token === "string") localStorage.setItem(AUTH_TOKEN_KEY, token);
        const identity = username || Name;
        localStorage.setItem("route-posts-username", identity);
        localStorage.setItem("route-posts-user-id", `local-${identity.toLowerCase().replace(/\s+/g, "-")}`);
        toast.success(response.data.message || "Registration successful");
        navigate(token ? "/feed" : "/auth/login", { replace: true });
      } else {
        toast.error(response.data?.message || "Registration failed");
      }
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "An error occurred during registration"
          : "An error occurred during registration",
      );
    }
  }

  return (
    <AuthCard
      title="Create a new account"
      subtitle={
        <>
          It is <span className="text-[#00298d]">quick</span> and easy.
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register("Name")}
          icon={<UserIcon />}
          aria-label="Full name"
          placeholder="Full name"
          autoComplete="name"
          error={errors.Name?.message}
        />
        <TextField
          {...register("username")}
          icon={<AtIcon />}
          aria-label="Username"
          placeholder="Username (optional)"
          autoComplete="username"
          error={errors.username?.message}
        />
        <TextField
          {...register("email")}
          icon={<AtIcon />}
          aria-label="Email address"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          error={errors.email?.message}
        />
        <SelectField
          {...register("gender")}
          icon={<UsersIcon />}
          aria-label="Gender"
          defaultValue=""
          error={errors.gender?.message}
        >
          <option value="" disabled>
            Select gender
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </SelectField>
        <TextField
          {...register("dateOfBirth")}
          icon={<CalendarIcon />}
          aria-label="Date of birth"
          type="date"
          error={errors.dateOfBirth?.message}
        />
        <TextField
          {...register("password")}
          icon={<KeyIcon />}
          aria-label="Password"
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          error={errors.password?.message}
        />
        <TextField
          {...register("confirmPassword")}
          icon={<KeyIcon />}
          aria-label="Confirm password"
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11.5 w-full rounded-xl bg-[#00298d] text-sm font-bold text-white transition hover:bg-main disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create New Account"}
        </button>
      </form>
    </AuthCard>
  );
}
