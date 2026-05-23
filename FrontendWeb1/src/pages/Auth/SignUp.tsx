import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { useLocation } from "react-router";

export default function SignUp() {
  // get optional role from querystring
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const role = params.get("role") || "";

  console.log('SignUp component rendered, role=', role, 'location=', location.pathname + location.search);

  const title = role
    ? `${role.charAt(0).toUpperCase() + role.slice(1)} SignUp Dashboard | TailAdmin` 
    : "React.js SignUp Dashboard | TailAdmin - Next.js Admin Dashboard Template";
  const desc = role
    ? `Create an account as a ${role} in TailAdmin.`
    : "This is React.js SignUp Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template";

  return (
    <>
      <PageMeta
        title={title}
        description={desc}
      />
      <AuthLayout>
        <SignUpForm role={role || undefined} />
      </AuthLayout>
    </>
  );
}
