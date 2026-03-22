"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { useLoginMutation } from "@/store/kraevedApi"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import { auth } from "@/lib/auth"
import styles from "./AuthModal.module.css"

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// ── Телефон: 10 цифр после +7; ввод без «живой» маски (курсор не прыгает) ───

/** Нормализация вставки: +7…, 8…, скобки и пробелы → 10 цифр (9XX…) */
function normalizeNationalDigits(input: string): string {
  let raw = input.replace(/\D/g, "")
  if (raw.length >= 11 && raw.startsWith("7")) raw = raw.slice(1)
  if (raw.length >= 11 && raw.startsWith("8")) raw = raw.slice(1)
  return raw.slice(0, 10)
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.slice(0, 10)
  if (d.length === 0) return "+7"
  let s = "+7"
  if (d.length <= 3) return `${s} (${d}`
  s += ` (${d.slice(0, 3)}) ${d.slice(3, 6)}`
  if (d.length <= 6) return s
  s += `-${d.slice(6, 8)}`
  if (d.length <= 8) return s
  return `${s}-${d.slice(8, 10)}`
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AuthModal({ open, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [login, { isLoading }] = useLoginMutation()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [digits, setDigits] = useState("") // 10 digits without +7
  const [code, setCode] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const phoneRef = useRef<HTMLInputElement>(null)

  // Focus phone input on open
  useEffect(() => {
    if (open && step === "phone") {
      setTimeout(() => phoneRef.current?.focus(), 100)
    }
  }, [open, step])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("phone")
      setDigits("")
      setCode(["", "", "", ""])
      setError("")
    }
  }, [open])

  if (!open) return null

  // ── Phone step ─────────────────────────────────────────────────────────

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDigits(normalizeNationalDigits(e.target.value))
    setError("")
  }

  function handlePhonePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData("text") || ""
    setDigits(normalizeNationalDigits(text))
    setError("")
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitPhone()
  }

  function submitPhone() {
    if (digits.length < 10) {
      setError("Введите 10 цифр номера")
      return
    }
    setError("")
    setStep("code")
    setTimeout(() => codeRefs.current[0]?.focus(), 100)
  }

  // ── Code step ──────────────────────────────────────────────────────────

  function handleCodeInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setError("")

    if (digit && index < 3) {
      codeRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 filled
    if (digit && index === 3) {
      const fullCode = next.join("")
      if (fullCode.length === 4) {
        submitCode(fullCode)
      }
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
    if (e.key === "Enter") {
      const fullCode = code.join("")
      if (fullCode.length === 4) submitCode(fullCode)
    }
  }

  async function submitCode(_codeStr?: string) {
    const fullPhone = "+7" + digits
    try {
      const data = await login({ phone: fullPhone }).unwrap()
      const raw = data as unknown as { access_token?: string; token?: string }
      const access =
        typeof raw.access_token === "string"
          ? raw.access_token.trim()
          : typeof raw.token === "string"
            ? raw.token.trim()
            : null
      if (!access) {
        setError("Сервер не вернул токен — попробуйте ещё раз")
        return
      }
      auth.setToken(access.trim())
      onClose()
      if (onSuccess) {
        onSuccess()
      } else {
        router.replace("/")
      }
    } catch (e: any) {
      setError(e?.data?.detail || "Не удалось войти")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.topRow}>
          <span className={styles.topLabel}>{step === "phone" ? "Авторизация" : "Подтверждение"}</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {step === "phone" ? (
          <>
            <h2 className={styles.title}>
              Добро пожаловать<br />
              в <BrandMark />
            </h2>
            <label className={styles.phoneLabel} htmlFor="auth-phone-national">
              Номер телефона
            </label>
            <div className={styles.phoneRow}>
              <span className={styles.phonePrefix} aria-hidden>
                +7
              </span>
              <input
                id="auth-phone-national"
                ref={phoneRef}
                className={styles.phoneInput}
                placeholder="900 123 45 67"
                value={digits}
                onChange={handlePhoneChange}
                onPaste={handlePhonePaste}
                onKeyDown={handlePhoneKeyDown}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="done"
                maxLength={10}
                aria-describedby="auth-phone-hint"
              />
            </div>
            <p id="auth-phone-hint" className={styles.phoneHint}>
              10 цифр без +7 и 8. Можно вставить номер целиком.
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.submitBtn} onClick={submitPhone} disabled={digits.length < 10}>
              Получить код
            </button>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Введите код</h2>
            <p className={styles.codeSub}>
              Отправлен на {formatPhoneDisplay(digits)}
            </p>
            <div className={styles.codeRow}>
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={el => { codeRefs.current[i] = el }}
                  className={styles.codeInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.submitBtn}
              onClick={() => submitCode()}
              disabled={isLoading || code.join("").length < 4}
            >
              {isLoading ? "Входим..." : "Подтвердить"}
            </button>
            <button className={styles.backBtn} onClick={() => { setStep("phone"); setCode(["","","",""]); setError("") }}>
              Изменить номер
            </button>
          </>
        )}
      </div>
    </div>
  )
}
