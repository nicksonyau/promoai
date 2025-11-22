export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  // No sidebar, no dashboard shell
  return <>{children}</>;
}
