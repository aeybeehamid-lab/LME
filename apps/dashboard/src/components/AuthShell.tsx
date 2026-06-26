"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/finance", label: "Finance" },
  { href: "/riders", label: "Riders" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, getToken } = useAuth();
  const isLoggedIn = Boolean(getToken());
  const isLoginPage = pathname === "/login";

  return (
    <>
      <nav className="nav">
        <strong style={{ marginRight: 12 }}>LME Admin</strong>
        {!isLoginPage &&
          navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        {isLoggedIn && !isLoginPage ? (
          <button
            type="button"
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              color: "var(--green-accent)",
              cursor: "pointer",
              fontSize: "0.9375rem",
              fontWeight: 500,
              padding: 0,
              letterSpacing: "0.02em",
            }}
          >
            Sign out
          </button>
        ) : isLoginPage ? null : (
          <Link href="/login">Login</Link>
        )}
      </nav>
      {children}
    </>
  );
}