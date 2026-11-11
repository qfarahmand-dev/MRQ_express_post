import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  optionalLabel?: string
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ id, label, required, optionalLabel, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          optionalLabel && <span className="text-xs font-normal text-muted-foreground">({optionalLabel})</span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
