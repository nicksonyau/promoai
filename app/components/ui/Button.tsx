interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
}

export default function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  const styles = variant === "secondary" ? "btn-secondary" : "btn-primary"

  return (
    <button
      {...props}
      className={`${styles} ${className || ""}`}
    >
      {children}
    </button>
  )
}
