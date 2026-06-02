import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/finance", label: "Finance" },
  { href: "/riders", label: "Riders" },
  { href: "/login", label: "Login" }
];

export function DashboardNav() {
  return (
    <nav className="nav">
      <strong style={{ marginRight: 12 }}>LME Executive</strong>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
