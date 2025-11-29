"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { API_URL } from "@/config";
import toast from "react-hot-toast";

import Card from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import useTranslations from "@/app/hooks/useTranslations";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const lang = (params?.lang as string) || "en";
  const { t } = useTranslations(lang);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Toast messages from redirects
  useEffect(() => {
    const verifySent = searchParams.get("verify");
    const verified = searchParams.get("verified");

    if (verifySent === "sent") {
      toast.success(t("login.verify_sent"));
    }
    if (verified === "1") {
      toast.success(t("login.verified"));
    }
  }, [searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        if (data.user) {
          // Save full user object (existing)
          localStorage.setItem("user", JSON.stringify(data.user));

          const companyId = data.user.companyId;
          if (companyId) {
            localStorage.setItem("companyId", companyId);
            console.log("[Login] companyId:", companyId);
          } else {
            console.warn("[Login] No companyId received in user object");
          }
        }

        // ---------------------------------------------------
        // 🔥 NEW: Save session token for Authorization header
        // ---------------------------------------------------
        if (data.token) {
          localStorage.setItem("sessionToken", data.token);
          console.warn("[Login] Session token:", data.token);
        } else {
          console.warn("[Login] No session token returned from server");
        }

        toast.success(t("login.success"));
        router.replace(`/${lang}/dashboard`);
        return;
      }

      toast.error(data?.error || t("login.invalid"));
    } catch (err) {
      toast.error(t("errors.SERVER_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Card>
        <h2 className="form-title">{t("login.title")}</h2>
        <p className="text-muted text-center mb-6">
          {t("login.subtitle")}{" "}
          <span className="text-purple-600 font-semibold">PromoHubAI</span>
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* EMAIL */}
          <div>
            <label className="form-label">{t("login.email")}</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="form-label">{t("login.password")}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? t("login.loading") : t("login.login_button")}
          </Button>
        </form>

        {/* REGISTER LINK */}
        <div className="mt-6 text-center text-muted">
          {t("login.no_account")}{" "}
          <a href={`/${lang}/register`} className="text-purple-600 hover:underline">
            {t("login.register_here")}
          </a>
        </div>
      </Card>
    </div>
  );
}
