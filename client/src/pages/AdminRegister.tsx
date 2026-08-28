import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AdminRegister() {
  const [, setLocation] = useLocation();
  const { signUp, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      const { error: signUpError } = await signUp(email, password, fullName);

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("rate limit")) {
          setError(
            "Too many registration emails have been requested. Please wait and try again later."
          );
        } else {
          setError(signUpError.message);
        }

        return;
      }

      setSuccess(true);

      toast.success(
        "Registration successful! Please sign in with your new credentials once your administrator promotes your account."
      );

      setEmail("");
      setFullName("");
      setPassword("");
      setConfirmPassword("");

      setLocation("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#012770] px-5 py-12">
      <div className="w-full max-w-md bg-white p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)] sm:p-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-extrabold text-[#012770]">
            ConcordVest
          </div>

          <span className="border border-[#ED7D01] px-2 py-1 text-[0.54rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
            Registration
          </span>
        </div>

        <div className="mt-12">
          <p className="eyebrow">Create Account</p>

          <h1 className="display-serif mt-5 text-[3.5rem] leading-[0.9] text-[#012770]">
            Register workspace profile.
          </h1>

          <p className="mt-5 text-[0.78rem] leading-[1.7] text-[#637085]">
            Register your credentials to request workspace access. All new
            accounts start with basic visitor permissions.
          </p>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-[0.75rem] text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 space-y-2 border border-green-200 bg-green-50 p-4 text-[0.75rem] text-green-800">
            <p className="font-extrabold">Registration successful!</p>

            <p>
              Your account has been created. Please contact your system
              administrator to promote your role to Staff, Editor, or Admin to
              access the dashboard.
            </p>

            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="mt-2 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#012770] underline hover:text-[#ED7D01]"
            >
              Go to sign in ↗
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <label className="form-label">
              Full Name
              <input
                className="form-input"
                type="text"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                placeholder="Audu Ibrahim"
                required
              />
            </label>

            <label className="form-label">
              Email
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="staff@concordvest.com"
                required
              />
            </label>

            <label className="form-label">
              Password
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <label className="form-label">
              Confirm Password
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-[#ED7D01] px-5 py-4 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#012770] transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting || isLoading ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Submit Request ↗"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[#012770]/10 pt-5 text-[0.63rem] font-extrabold uppercase tracking-[0.12em]">
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            className="text-[#637085] hover:text-[#012770]"
          >
            ← Back to sign in
          </button>

          <a href="/" className="text-[#637085] hover:text-[#012770]">
            Public portal ↗
          </a>
        </div>
      </div>
    </div>
  );
}
