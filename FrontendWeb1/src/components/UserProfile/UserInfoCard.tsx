import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useNavigate } from "react-router";
import { updateProfile } from "../../services/user";
import Prompt from "../common/Prompt";

type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName?: string;
  phone?: string;
};

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();

  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const initialUser: UserProfile | null = storedUser
    ? JSON.parse(storedUser)
    : null;

  const [user, setUser] = useState<UserProfile | null>(initialUser);

  const [firstName, setFirstName] = useState(initialUser?.firstName || "");
  const [lastName, setLastName] = useState(initialUser?.lastName || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [companyName, setCompanyName] = useState(initialUser?.companyName || "");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info" | null>(
    null,
  );

  const isAdvertiser = (user?.role || "").toLowerCase() === "advertiser";

  useEffect(() => {
    if (!initialUser) {
      navigate("/signin");
    }
  }, [initialUser, navigate]);

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        email,
        phone,
        ...(isAdvertiser ? { companyName } : {}),
      });
      setUser(updated as UserProfile);
      setStatusMessage("Profile information updated successfully.");
      setStatusType("success");
      closeModal();
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des informations perso :",
        error,
      );
      setStatusMessage("Failed to update profile information.");
      setStatusType("error");
    }
  };

  if (!user) {
    return null;
  }

  const handleOpenModal = () => {
    // Réinitialise les champs à partir des données utilisateur actuelles
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setCompanyName(user.companyName || "");
    }
    openModal();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 relative">
      <Prompt
        visible={!!statusMessage}
        message={statusMessage}
        variant={statusType || "info"}
        onClose={() => {
          setStatusMessage("");
          setStatusType(null);
        }}
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.firstName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.lastName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p
                className={`text-sm font-medium ${
                  user.phone
                    ? "text-gray-800 dark:text-white/90"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {user.phone || "+216 50 000 000"}
              </p>
            </div>

            {isAdvertiser && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Company Name
                </p>
                <p
                  className={`text-sm font-medium ${
                    user.companyName
                      ? "text-gray-800 dark:text-white/90"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {user.companyName || "Not set"}
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] max-h-[80vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      placeholder="e.g. +216 50 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {isAdvertiser && (
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Company Name</Label>
                      <Input
                        type="text"
                        placeholder="e.g. My Company"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
