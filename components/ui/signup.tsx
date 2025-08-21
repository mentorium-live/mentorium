"use client";

import * as React from "react";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
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

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

interface InputProps extends React.ComponentProps<"input"> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {}
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    className={cn("text-sm font-medium leading-none", className)}
    ref={ref}
    {...props}
  />
));
Label.displayName = "Label";

export default function SignUp() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h3 className="text-lg font-semibold text-foreground">Create your account</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account? {" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </a>
          </p>

          <form action="#" method="post" className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email-signup">Email</Label>
              <Input
                type="email"
                id="email-signup"
                name="email"
                autoComplete="email"
                placeholder="username@st.knust.edu.gh"
                className="mt-2"
                pattern={"^[A-Za-z0-9._%+-]+@(st\\.knust\\.edu\\.gh|knust\\.edu\\.gh)$"}
                title="Email must be a knust.edu.gh or st.knust.edu.gh address"
                required
              />
            </div>
            <div>
              <Label htmlFor="password-signup">Password</Label>
              <Input type="password" id="password-signup" name="password" className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="confirm-password-signup">Confirm Password</Label>
              <Input type="password" id="confirm-password-signup" name="confirmPassword" className="mt-2" required />
            </div>
            <Button type="submit" className="mt-4 w-full py-2 font-medium">
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 