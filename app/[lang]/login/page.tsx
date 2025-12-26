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

  // Handle toast messages from redirects
  useEffect(() => {
    if (searchParams.get("verify") === "sent") {
      toast.success(t("login.verify_sent"));
    }
    if (searchParams.get("verified") === "1") {
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
          localStorage.setItem("user", JSON.stringify(data.user));
          if (data.user.companyId) {
            localStorage.setItem("companyId", data.user.companyId);
          }
        }

        if (data.token) {
          localStorage.setItem("sessionToken", data.token);
        }

        toast.success(t("login.success"));
        router.replace(`/${lang}/dashboard`);
        return;
      }

      toast.error(data?.error || t("login.invalid"));
    } catch {
      toast.error(t("errors.SERVER_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT — PRODUCT STORY */}
      <div
        className="hidden lg:flex flex-col justify-center px-16 relative"
        style={{
          backgroundImage: "url(/images/auth-hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">
            Your AI Agent That Builds, Promotes & Talks
          </h1>

          <p className="text-white/80 mb-6">
            Everything you need to launch AI-powered promo microsites,
            WhatsApp chatbots, QR campaigns, and lead capture — in minutes.
          </p>

          <ul className="space-y-2 text-white/90 text-sm">
            <li>✅ 1-click AI promo microsites</li>
            <li>✅ WhatsApp chatbot & lead capture</li>
            <li>✅ QR campaigns & vouchers</li>
            <li>✅ Auto-updating SEO content</li>
            <li>✅ Built for F&B, retail & SMEs</li>
          </ul>

          <p className="mt-6 text-xs text-white/60">
            Trusted by growing businesses across Asia.
          </p>
        </div>
      </div>

      {/* RIGHT — LOGIN (✅ CENTERED) */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="form-card">
          <h2 className="form-title">{t("login.title")}</h2>

          <p className="text-muted text-center mb-6">
            {t("login.subtitle")}{" "}
            <span className="text-primary font-semibold">PromoHubAI</span>
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="email"
              label={t("login.email")}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label={t("login.password")}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? t("login.loading") : t("login.login_button")}
            </Button>
          </form>

          <div className="mt-6 text-center text-muted">
            {t("login.no_account")}{" "}
            <a href={`/${lang}/register`} className="link-primary">
              {t("login.register_here")}
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
