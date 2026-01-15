import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResetPasswordResult {
  success: boolean;
  message?: string;
}

interface ForgotPasswordFormProps {
  onResetPassword: (payload: {
    email?: string;
    phone?: string;
    newPassword?: string;
    code?: string;
  }) => Promise<ResetPasswordResult>;
  onVerifyEmail: (email: string, code: string) => Promise<boolean>;
  onVerifyPhone: (phone: string, code: string) => Promise<boolean>;
  onBackClick?: () => void;
  error?: string | null;
  isLoading?: boolean;
  className?: string;
}

type Step = "request" | "verify" | "new-password";
type ContactMethod = "email" | "phone";

export function ForgotPasswordForm({
  onResetPassword,
  onVerifyEmail,
  onVerifyPhone,
  onBackClick,
  error,
  isLoading = false,
  className = "",
}: ForgotPasswordFormProps): React.ReactElement {
  const [step, setStep] = useState<Step>("request");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (contactMethod === "email" && !email) {
      setLocalError("Введите email");
      return;
    }

    if (contactMethod === "phone" && !phone) {
      setLocalError("Введите номер телефона");
      return;
    }

    const result = await onResetPassword({
      email: contactMethod === "email" ? email : undefined,
      phone: contactMethod === "phone" ? phone : undefined,
    });

    if (result.success) {
      setMessage(result.message || "Код отправлен");
      setStep("verify");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (code.length !== 6) {
      setLocalError("Введите 6-значный код");
      return;
    }

    let verified = false;
    
    if (contactMethod === "email") {
      verified = await onVerifyEmail(email, code);
    } else {
      verified = await onVerifyPhone(phone, code);
    }

    if (verified) {
      setMessage("Код подтвержден. Введите новый пароль");
      setStep("new-password");
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!newPassword) {
      setLocalError("Введите новый пароль");
      return;
    }

    if (newPassword.length < 8) {
      setLocalError("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Пароли не совпадают");
      return;
    }

    const result = await onResetPassword({
      email: contactMethod === "email" ? email : undefined,
      phone: contactMethod === "phone" ? phone : undefined,
      code,
      newPassword,
    });

    if (result.success) {
      setMessage("Пароль успешно изменен! Войдите с новым паролем");
      setTimeout(() => {
        onBackClick?.();
      }, 2000);
    }
  };

  const handleResend = async () => {
    setLocalError(null);
    setCode("");

    const result = await onResetPassword({
      email: contactMethod === "email" ? email : undefined,
      phone: contactMethod === "phone" ? phone : undefined,
    });

    if (result.success) {
      setMessage("Код отправлен повторно");
    }
  };

  const displayError = error || localError;

  if (step === "new-password") {
    return (
      <Card className={className}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Новый пароль</CardTitle>
          <CardDescription>
            Придумайте надежный пароль
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSetNewPassword}>
          <CardContent className="space-y-4">
            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {message}
              </div>
            )}

            {displayError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {displayError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить пароль"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card className={className}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Подтверждение</CardTitle>
          <CardDescription>
            Введите 6-значный код, отправленный на {contactMethod === "email" ? email : phone}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerifyCode}>
          <CardContent className="space-y-4">
            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {message}
              </div>
            )}

            {displayError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {displayError}
              </div>
            )}

            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? "Проверка..." : "Подтвердить код"}
            </Button>

            <div className="flex items-center justify-between w-full text-sm">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-muted-foreground hover:text-primary"
              >
                ← Назад
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-primary hover:underline underline-offset-4 disabled:opacity-50"
              >
                Отправить код повторно
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Забыли пароль?</CardTitle>
        <CardDescription>
          Мы отправим код для восстановления
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRequestCode}>
        <CardContent className="space-y-4">
          {displayError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {displayError}
            </div>
          )}

          <div className="space-y-2">
            <Label>Способ связи</Label>
            <Tabs value={contactMethod} onValueChange={(v) => setContactMethod(v as ContactMethod)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Телефон</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="mt-4">
                <Input
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </TabsContent>
              
              <TabsContent value="phone" className="mt-4">
                <Input
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Отправка..." : "Отправить код"}
          </Button>

          {onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Вернуться ко входу
            </button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default ForgotPasswordForm;
