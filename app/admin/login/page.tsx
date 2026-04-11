import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Connexion - Get Easy Admin",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center flex flex-col items-center gap-3">
          <img src="/logo-white.svg" alt="Get Easy" className="h-10 w-auto" />
          <p className="text-gray-400 text-sm">Espace administration</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
