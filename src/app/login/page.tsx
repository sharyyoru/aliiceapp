import { redirect } from "next/navigation";

// Temporary: the L'Abeille demo tenant is the default branded login.
// Revert to the original LoginForm page when multi-brand login returns.
export default function LoginPage() {
  redirect("/labeille/login");
}
