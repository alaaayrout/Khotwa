import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import countryCallingCodes from "./countryCallingCodes"

const DEFAULT_SYRIA_CODE = "+963"

const isValidDialCode = (code) => /^\+\d{1,4}$/.test(code)

export default function CountryCodeSelect({ value, onChange, className, required }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "ar" ? "ar" : "en"
  const [loading, setLoading] = useState(false)

  // Build display names using Intl.DisplayNames for locale-aware country names
  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" })
    } catch (e) {
      return null
    }
  }, [lang])

  const countries = useMemo(() => {
    const list = countryCallingCodes
      .map((c) => {
        if (!c || !c.iso2 || !c.code) return null
        if (!isValidDialCode(c.code)) return null
        const region = c.iso2.toUpperCase()
        const name = displayNames ? displayNames.of(region) : region
        return { name: name || region, code: c.code }
      })
      .filter(Boolean)

    // Sort by localized name
    list.sort((a, b) => a.name.localeCompare(b.name, lang))
    return list
  }, [displayNames, lang])

  // Ensure default selection is Syria (+963) when nobody provided a value.
  useEffect(() => {
    if (!value && typeof onChange === "function") {
      onChange(DEFAULT_SYRIA_CODE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <select
      value={value || DEFAULT_SYRIA_CODE}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={className}
      required={required}
      disabled={loading}
    >
      {loading && <option>{t("country_code.loading", "Loading country codes...")}</option>}
      {!loading && (
        <>
          <option value="">{t("country_code.select", "Select country code")}</option>
          {countries.map((c, idx) => (
            <option key={`${c.code}-${idx}`} value={c.code}>
              {`${c.name} ${c.code}`}
            </option>
          ))}
        </>
      )}
    </select>
  )
}
