import { useState, useRef } from "react";
import { Link, useLocation } from "react-router";
import Prompt from "../../components/common/Prompt";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { api } from "../../services/api"; 

interface SignUpFormProps {
  role?: string;
}

export default function SignUpForm({ role: propRole }: SignUpFormProps) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roleFromQueryOrProp = propRole || params.get("role") || "";
  const lockedRole = roleFromQueryOrProp.toLowerCase() === "operator" ? "operator" : null;

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);
  const confettiRef = useRef<HTMLDivElement | null>(null);

  // Nouveau : états pour les champs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(lockedRole ?? roleFromQueryOrProp);

  const spawnConfetti = (count = 18) => {
    const container = confettiRef.current || document.body;
    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.src = "/images/logo/maker.logo.png";
      img.className = "confetti-piece";
      const size = Math.floor(Math.random() * 28) + 18;
      img.style.width = `${size}px`;
      img.style.left = `${Math.random() * 100}vw`;
      img.style.top = `-10vh`;
      img.style.pointerEvents = "none";
      img.style.position = "fixed";
      img.style.zIndex = "60";
      img.style.opacity = "0.95";
      const duration = (Math.random() * 1.8 + 1.6).toFixed(2);
      img.style.animation = `confettiFall ${duration}s linear forwards`;
      img.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
      img.addEventListener("animationend", () => img.remove());
      container.appendChild(img);
    }
  };

  // --- Nouvelle fonction handleSubmit pour appeler le backend ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        role: lockedRole ?? role,
        requiresAdminApproval: (lockedRole ?? role).toLowerCase() === "operator",
      });

      const data = response.data as unknown;
      if (data && typeof data === "object") {
        const d = data as { token?: string; accessToken?: string; message?: string };
        if (d.token) localStorage.setItem("authToken", d.token);
        else if (d.accessToken) localStorage.setItem("authToken", d.accessToken);
        localStorage.setItem("user", JSON.stringify(d));
        setMessage(
          d.message ||
            "Account created. If operator: waiting for admin approval email.",
        );
      } else {
        // backend may return plain string
        setMessage(String(data || "Account created."));
      }

      setMessageType("success");
      spawnConfetti(20);

      // reset des champs
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("");
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data as unknown;
        if (typeof data === "string") setMessage(data);
        else if (data && typeof data === "object") {
          const maybeMsg = (data as { message?: string; error?: string }).message ?? (data as { error?: string }).error;
          setMessage(maybeMsg || JSON.stringify(data));
        } else {
          setMessage("Registration failed.");
        }
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setMessageType("error");
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0.85; }
          }
          .confetti-piece { will-change: transform, opacity; }
        `}</style>
      <div ref={confettiRef} className="pointer-events-none" />
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to home
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {roleFromQueryOrProp ? `${roleFromQueryOrProp.charAt(0).toUpperCase() + roleFromQueryOrProp.slice(1)} Sign Up` : "Sign Up"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {roleFromQueryOrProp ? `Create an account as a ${roleFromQueryOrProp}.` : "Enter your email and password to sign up!"}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>First Name<span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>Last Name<span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Role<span className="text-error-500">*</span></Label>
                  {lockedRole ? (
                    <Input type="text" value="Operator" disabled />
                  ) : (
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="">Select role</option>
                      <option value="operator">Operator</option>
                      <option value="advertiser">Advertiser</option>
                    </select>
                  )}
                </div>

                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label>Password<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-gradient-to-r from-orange-200 to-orange-300 shadow-theme-xs hover:from-orange-300 hover:to-orange-400"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </form>

            <Prompt
              visible={!!message}
              message={message}
              variant={messageType || (message ? "info" : "info")}
              onClose={() => {
                setMessage("");
                setMessageType(null);
              }}
            />

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}