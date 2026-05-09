// This route now redirects to /{category}/{name-slug}-{id}.
// Layout is a pass-through — no metadata or JSON-LD needed for a redirect response.
export default function ProductRedirectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
