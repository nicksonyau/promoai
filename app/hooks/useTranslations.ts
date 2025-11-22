import en from "@/app/locales/en.json"
import zh from "@/app/locales/zh.json"
import ms from "@/app/locales/ms.json"

const dictionaries: any = { en, zh, ms }

// Get dictionary safely
export function getDictionary(lang: string) {
  return dictionaries[lang] || dictionaries["en"]
}

export default function useTranslations(lang: string = "en") {
  const dict = dictionaries[lang] || dictionaries["en"]

  // Support nested keys: "register.first_name" or "errors.EMAIL_REQUIRED"
  const t = (key: string): string => {
    const parts = key.split(".")
    let current: any = dict

    for (const part of parts) {
      current = current?.[part]
      if (current === undefined) return key // fallback: return key itself
    }

    return typeof current === "string" ? current : key
  }

  return { t }
}
