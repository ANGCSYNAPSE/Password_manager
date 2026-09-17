import AnimatedBackground from "@/components/AnimatedBackground";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AnimatedBackground />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
