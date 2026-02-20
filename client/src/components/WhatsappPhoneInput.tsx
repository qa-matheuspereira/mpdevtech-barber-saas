import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  validateWhatsAppNumber,
  formatPhoneForDisplay,
  type PhoneValidationResult,
} from "@/../../shared/whatsapp-validator";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";

interface WhatsappPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: PhoneValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
  showFormatted?: boolean;
}

export function WhatsappPhoneInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Digite seu número WhatsApp",
  disabled = false,
  showFormatted = true,
}: WhatsappPhoneInputProps) {
  const [validation, setValidation] = useState<PhoneValidationResult | null>(
    null
  );
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value) {
      const result = validateWhatsAppNumber(value);
      setValidation(result);
      onValidationChange?.(result);

      if (result.isValid && showFormatted) {
        setDisplayValue(formatPhoneForDisplay(value));
      }
    } else {
      setValidation(null);
      setDisplayValue("");
    }
  }, [value, onValidationChange, showFormatted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    onChange(inputValue);
  };

  const handleBlur = () => {
    if (value && validation?.isValid && showFormatted) {
      setDisplayValue(formatPhoneForDisplay(value));
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 ${
            validation
              ? validation.isValid
                ? "border-green-500 focus:border-green-500"
                : "border-red-500 focus:border-red-500"
              : ""
          }`}
        />
      </div>

      {validation && !validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validation.error}</AlertDescription>
        </Alert>
      )}

      {validation && validation.isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Número válido: {validation.formatted}
          </AlertDescription>
        </Alert>
      )}

      {value && !validation && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Validando número...</AlertDescription>
        </Alert>
      )}

      {!value && (
        <p className="text-xs text-muted-foreground">
          Formatos aceitos:
          <br />
          • Brasil: (11) 98765-4321 ou 11 98765-4321
          <br />
          • Internacional: +55 11 98765-4321
        </p>
      )}
    </div>
  );
}
