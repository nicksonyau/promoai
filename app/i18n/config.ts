export const languages = ["en", "zh", "ms"] as const
export type Lang = (typeof languages)[number]
