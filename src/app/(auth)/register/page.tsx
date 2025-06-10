
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-8 rounded-lg shadow-xl bg-card">
      <div className="flex flex-col space-y-2 text-center">
        <Icons.Logo className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-headline tracking-wider text-foreground">
          Create an Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to register
        </p>
      </div>
      <RegisterForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="hover:text-primary hover:underline underline-offset-4"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
