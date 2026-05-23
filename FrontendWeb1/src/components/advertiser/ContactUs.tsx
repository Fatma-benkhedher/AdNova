import { useEffect, useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";
import { createMessage } from "../../services/messages";

const REQUEST_TYPES = [
  { value: "feedback", label: "Feedback", icon: "\u{1F4AC}", color: "#34D399" },
  { value: "complaint", label: "Complaint", icon: "\u26A0\uFE0F", color: "#F87171" },
  { value: "technical", label: "Technical Support", icon: "\u{1F527}", color: "#60A5FA" },
  { value: "information", label: "Information Request", icon: "\u2139\uFE0F", color: "#A78BFA" },
];

const SendIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22,2 15,22 11,13 2,9" fill="currentColor" />
  </svg>
);

export default function ContactForm() {
  const [message, setMessage] = useState<string>("");
  const [subject, setSubject] = useState<string>(""); 
  const [requestType, setRequestType] = useState<string>("feedback");
  const [sending, setSending] = useState(false);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("user");
      if (!stored) return;
      const user = JSON.parse(stored) as any;
      setFirstName(typeof user?.firstName === "string" ? user.firstName : "");
      setLastName(typeof user?.lastName === "string" ? user.lastName : "");
      setEmail(typeof user?.email === "string" ? user.email : "");
      setPhone(typeof user?.phone === "string" ? user.phone : "");
    } catch {
      // ignore
    }
  }, []);

  const handleSend = async () => {
    setStatus("");
    setStatusType("");

    if (!subject.trim() || !message.trim()) {
      setStatusType("error");
      setStatus("Please fill subject and message before sending.");
      return;
    }

    const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const user = stored ? (JSON.parse(stored) as { id?: number }) : null;
    const userId = user?.id;
    if (!userId) {
      setStatusType("error");
      setStatus("You must be logged in to send a message.");
      return;
    }

    setSending(true);
    try {
      await createMessage({
        requestType,
        subject,
        message,
        userId,
      });
      setStatusType("success");
      setStatus("Your message has been sent successfully.");
      setMessage("");
      setSubject("");
      setRequestType("feedback");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send message", error);
      setStatusType("error");
      setStatus("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ComponentCard title="">
      <div className="space-y-10">

       {/* LANDMARK SECTION */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-white/[0.05]">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold">LANDMARKIT</h3>
              <p className="text-sm text-gray-500 mt-2">
                Technopole El Ghazala <br />
                Ariana, Tunisia, 2088 <br />
              </p>
            </div>
            <div>
            <div className="text-sm text-gray-500 mt-7">
              <p>+216 25 801 660</p>
              <p>contact@makerskills.tn</p>
            </div>
            </div>
          </div>
        </div>

        {/* FORM + MAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* LEFT — FORM */}
          <div className="space-y-6">
            {status && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${
                  statusType === "success"
                    ? "border-success-500/40 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200"
                    : "border-red-500/40 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                }`}
              >
                {status}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Request Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {REQUEST_TYPES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRequestType(r.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      requestType === r.value
                        ? "border-2"
                        : "border border-gray-200 dark:border-gray-700 bg-white/5 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400"
                    }`}
                    style={
                      requestType === r.value
                        ? {
                            background: `${r.color}18`,
                            borderColor: `${r.color}88`,
                            color: r.color,
                          }
                        : undefined
                    }
                  >
                    <span className="text-base">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW SUBJECT FIELD */}
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>

            <div>
              <Label>Message</Label>
              <TextArea
                value={message}
                onChange={(value: string) => setMessage(value)}
                rows={5}
              />
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleSend}
              disabled={sending}
              startIcon={<SendIcon />}
            >
              {sending ? "Sending..." : "Send Message"}
            </Button>

          </div>

          {/* RIGHT — MAP */}
          <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-white/[0.05]">
            <iframe
              title="Location: V5VP+QF6, Cebalat Ben Ammar, Ariana, Tunisia"
              src="https://www.google.com/maps?ll=36.89438,10.186576&z=18&t=h&hl=fr&gl=TN&output=embed"
              className="w-full h-full min-h-[350px]"
              loading="lazy"
              allowFullScreen
            />
          </div>

        </div>
      </div>
    </ComponentCard>
  );
}