"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[oklch(0.71_0.18_142.5)] text-white shadow-xs hover:bg-[oklch(0.58_0.18_142.5)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

interface InputProps extends React.ComponentProps<"input"> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {}
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Label.displayName = "Label";

interface AuthFormProps {
  variant: "login" | "signup" | "forgot";
}

// Mentorium geometric logo (copied from original login component)
const Logo = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    viewBox="0 0 40 48"
    width="40"
    height="48"
    {...props}
  >
    <clipPath id="mentorLogoClip">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#mentorLogoClip)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
);

export default function AuthForm({ variant }: AuthFormProps) {
  const router = useRouter();
  const [view, setView] = React.useState<AuthFormProps["variant"]>(variant);

  const isSignup = view === "signup";
  const isForgot = view === "forgot";

  const heading = isSignup
    ? "Create your account"
    : isForgot
    ? "Reset your password"
    : "Log into your account";

  const buttonText = isSignup
    ? "Sign Up"
    : isForgot
    ? "Send reset link"
    : "Sign In";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center gap-2 w-full">
            <Image
              src="/logo.png"
              alt="KNUST crest"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground dark:text-foreground">
            {heading}
          </h3>

          {!isForgot && (
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  const target = isSignup ? "login" : "signup";
                  setView(target);
                  router.push(`/${target}`);
                }}
                className="font-medium underline-offset-4 text-[#007427] hover:text-[#005c20]"
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          )}

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()

              const data = new FormData(e.currentTarget as HTMLFormElement)
              const email = String(data.get("email"))
              const password = String(data.get("password"))
              const confirm = String(data.get("confirm"))
              const fullName = String(data.get("name"))

              // Basic guard for allowed domains (extra safety – HTML pattern already handles UI)
              if (!/@(st\.knust\.edu\.gh|knust\.edu\.gh)$/.test(email)) {
                alert("Email domain not allowed")
                return
              }

              try {
                // Determine role based on email
                let userRole = "Coordinator" // default
                if (email === "tsadjaidoo@knust.edu.gh") {
                  userRole = "Coordinator"
                } else if (email === "ekeelson@knust.edu.gh" || email === "iacquah@knust.edu.gh") {
                  userRole = "Lecturer"
                } else if (email && (email.endsWith("@knust.edu.gh") || email.endsWith("@st.knust.edu.gh"))) {
                  userRole = "Lecturer"
                }

                if (view === "signup") {
                  if (password !== confirm) {
                    alert("Passwords do not match")
                    return
                  }
                  const { error } = await supabase.auth.signUp({ 
                    email, 
                    password, 
                    options: { 
                      data: { 
                        role: userRole, 
                        name: fullName 
                      } 
                    } 
                  })
                  if (error) throw error
                  alert("Signup successful! Check your inbox for verification.")
                  setView("login")
                  router.push("/login")
                } else if (view === "forgot") {
                  const { error } = await supabase.auth.resetPasswordForEmail(email)
                  if (error) throw error
                  alert("Password reset email sent.")
                } else {
                  const { error } = await supabase.auth.signInWithPassword({ email, password })
                  if (error) throw error
                  // The auth provider will handle role-based redirection
                }
              } catch (err: any) {
                alert(err?.message || "Something went wrong")
              }
            }}
          >
            {isSignup && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-foreground dark:text-foreground">
                  Full name
                </Label>
                <Input type="text" id="name" name="name" placeholder="Enter your full name" className="mt-2" required />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground dark:text-foreground">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="username@knust.edu.gh"
                className="mt-2"
                pattern="^[A-Za-z0-9._%+\\-]+@(st\\.knust\\.edu\\.gh|knust\\.edu\\.gh)$"
                title="Email must be a knust.edu.gh"
              />
            </div>

            {!isForgot && (
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground dark:text-foreground">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="**********"
                  className="mt-2"
                />
              </div>
            )}

            {isSignup && (
              <div>
                <Label htmlFor="confirm" className="text-sm font-medium text-foreground dark:text-foreground">
                  Confirm password
                </Label>
                <Input type="password" id="confirm" name="confirm" placeholder="**********" className="mt-2" required />
              </div>
            )}

            <Button type="submit" className="mt-4 w-full py-2 font-medium">
              {buttonText}
            </Button>
          </form>

          {!isForgot && (
            <p className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground">
              Forgot your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("forgot");
                  router.push("/forgot-password");
                }}
                className="font-medium underline-offset-4 text-[#007427] hover:text-[#005c20]"
              >
                Reset password
              </button>
            </p>
          )}

          {isForgot && (
            <p className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  router.push("/login");
                }}
                className="font-medium underline-offset-4 text-[#007427] hover:text-[#005c20]"
              >
                Back to login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 