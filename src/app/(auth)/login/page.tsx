
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  return (
    <div className="container mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] p-8 rounded-lg shadow-xl bg-card">
      <div className="flex flex-col space-y-2 text-center">
        <Icons.Logo className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-headline tracking-wider text-foreground">
          Welcome to {siteConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>
      <LoginForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="#" 
          className="hover:text-primary hover:underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </p>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="hover:text-primary hover:underline underline-offset-4"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
