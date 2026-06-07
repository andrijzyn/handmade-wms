"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsPending(true);
    try {
      await login(data); // login очікує { username, password }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Logo + Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mx-auto">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1
              className="text-xl font-semibold tracking-tight"
              data-testid="text-app-title"
            >
              StockPulse
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Warehouse management system
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-4 pt-5 px-5">
            <p className="text-sm font-medium text-foreground">System login</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter username"
                          autoComplete="username"
                          data-testid="input-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          autoComplete="current-password"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                  data-testid="button-login"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Access is granted by the system administrator
        </p>
      </div>
    </div>
  );
}
