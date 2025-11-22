// File: /app/[lang]/register/page.tsx
"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { API_URL } from "@/config"
import Card from "@/app/components/ui/Card"
import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import useTranslations from "@/app/hooks/useTranslations"
import { toast } from "react-hot-toast"
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid"

function RegisterClient() {
  const params = useParams()
  const router = useRouter()
  const lang = (params?.lang as string) || "en"
  const { t } = useTranslations(lang)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (!firstName || !lastName || !email || password.length < 8) {
      const msg = t("register.required")
      setMessage(msg)
      toast.error(msg)
      return
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const translated =
          t(`errors.${data.errorCode}`) || t("errors.SERVER_ERROR")
        setMessage(translated)
        toast.error(translated)
        return
      }

      // SUCCESS
      const successMsg = data?.message || "Success"
      setMessage(successMsg)
      toast.success(successMsg)

      // ⭐ Redirect to login after 5 seconds
      setTimeout(() => {
        router.push(`/${lang}/login`)
      }, 5000)

    } catch (err) {
      const errorMsg = t("errors.SERVER_ERROR")
      setMessage(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <div className="page-container">
      <Card>
        <h2 className="form-title">{t("register.title")}</h2>
        <p className="text-muted text-center mb-6">{t("register.subtitle")}</p>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* FIRST + LAST NAME */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">{t("register.first_name")}</label>
              <Input
                type="text"
                placeholder={t("register.first_name_placeholder")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">{t("register.last_name")}</label>
              <Input
                type="text"
                placeholder={t("register.last_name_placeholder")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="form-label">{t("register.email")}</label>
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
            <label className="form-label">{t("register.password")}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit">{t("register.signup")}</Button>
        </form>

        {/* INLINE MESSAGE */}
        {message && (
          <div className="mt-4 flex items-center justify-center gap-2 text-red-600 text-sm">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* LOGIN LINK */}
        <div className="mt-6 text-center text-muted">
          <span>{t("register.have_account")} </span>
          <a href={`/${lang}/login`} className="text-purple-600 hover:underline">
            {t("register.login_here")}
          </a>
        </div>
      </Card>
    </div>
  )
}

export default dynamic(() => Promise.resolve(RegisterClient), { ssr: false })
