import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import AuthLayout from "./AuthPageLayout";
import Prompt from "../../components/common/Prompt";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { api } from "../../services/api";

type Step = "email" | "code" | "password";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState<Step>(() => {
    const s = urlParams.get("step");
    const legacyToken = urlParams.get("token");
    if (legacyToken && legacyToken.trim().length > 8 && !legacyToken.match(/^\d{6}$/)) {
      return "password";
    }
    return s === "code" ? "code" : "email";
  });

  const [email, setEmail] = useState(() => urlParams.get("email")?.replace(/\+/g, " ") ?? "");
  const [code, setCode] = useState(() =>
    /^(\d{6})$/.test((urlParams.get("token") || "").trim())
      ? (urlParams.get("token") || "").trim()
      : ""
  );
  const [legacyLongToken] = useState(() => {
    const t = urlParams.get("token") || "";
    return t.trim().length > 8 && !t.trim().match(/^\d{6}$/) ? t.trim() : "";
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);

  useEffect(() => {
    const em = urlParams.get("email");
    if (em) setEmail(decodeURIComponent(em).replace(/\+/g, " "));
    const s = urlParams.get("step");
    if (s === "code" && urlParams.get("email")) setStep("code");
  }, [urlParams]);

  const showBanner = (text: string, type: typeof messageType) => {
    setMessage(text);
    setMessageType(type);
  };

  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showBanner("Please enter your email.", "error");
      return;
    }
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      showBanner("Check your inbox: enter the 6-digit code below.", "success");
      setStep("code");
    } catch {
      showBanner("Request failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const digits = code.replace(/\s+/g, "");
    if (!email.trim()) {
      showBanner("Email is required.", "error");
      return;
    }
    if (!/^\d{6}$/.test(digits)) {
      showBanner("Enter the 6-digit code from your email.", "error");
      return;
    }
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      await api.post("/auth/verify-reset-code", { email: email.trim(), code: digits });
      setCode(digits);
      setStep("password");
      showBanner("Code verified. Choose your new password.", "success");
    } catch (error: any) {
      const errMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : "Invalid or expired code.";
      showBanner(errMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();

    let tokenPayload = legacyLongToken;
    let emailPayload: string | undefined;

    if (legacyLongToken) {
      tokenPayload = legacyLongToken;
    } else {
      emailPayload = email.trim();
      tokenPayload = code.replace(/\s+/g, "");
      if (!/^\d{6}$/.test(tokenPayload)) {
        showBanner("Verification code missing or invalid.", "error");
        return;
      }
    }

    if (newPassword.length < 8) {
      showBanner("Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showBanner("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      await api.post("/auth/reset-password", {
        email: emailPayload ?? undefined,
        token: tokenPayload,
        newPassword,
        confirmPassword,
      });
      showBanner("Password updated. Redirecting to sign in…", "success");
      setTimeout(() => {
        navigate(
          `/signin?email=${encodeURIComponent((emailPayload ?? email).trim())}&pwdReset=1`,
          { replace: true },
        );
      }, 600);
    } catch (error: any) {
      const errMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : "Reset failed.";
      showBanner(errMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    step === "email"
      ? "Enter your email. We send a 6-digit code valid for 30 minutes."
      : step === "code"
        ? "Enter the verification code received by email."
        : legacyLongToken
          ? "Set a new password using your reset link token."
          : "Enter your new password and confirmation.";

  return (
    <>
      <PageMeta title="Forgot Password | Circuit Crew" description="Reset account password securely with email code." />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-10 mx-auto">
            <Link
              to="/signin"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Back to sign in
            </Link>
          </div>

          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Forgot password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>

            {step === "email" && (
              <form onSubmit={requestReset} className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" size="sm" disabled={loading}>
                  {loading ? "Sending…" : "Send verification code"}
                </Button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={verifyCode} className="space-y-6">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>
                    6-digit code <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    className="font-mono tracking-[0.4em]"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setStep("email")}
                    disabled={loading}
                  >
                    Change email
                  </Button>
                  <Button type="submit" className="w-full" size="sm" disabled={loading || code.replace(/\s/g, "").length !== 6}>
                    {loading ? "Checking…" : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={submitReset} className="space-y-6">
                {!legacyLongToken && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Signed in reset for <strong className="text-gray-700 dark:text-gray-300">{email.trim()}</strong>
                  </p>
                )}
                <div>
                  <Label>
                    New password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setShowNewPassword((v) => !v)}
                    >
                      {showNewPassword ? (
                        <EyeIcon className="fill-current size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-current size-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>
                    Confirm password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-current size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-current size-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => (!legacyLongToken ? setStep("code") : setStep("email"))}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full" size="sm" disabled={loading}>
                    {loading ? "Saving…" : "Update password"}
                  </Button>
                </div>
              </form>
            )}

            <Prompt
              visible={!!message}
              message={message}
              variant={messageType || "info"}
              onClose={() => {
                setMessage("");
                setMessageType(null);
              }}
            />
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
