"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

// Simple top navigation bar: shows brand, user name, and Log out button.
export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const onLogin = path.startsWith("/login");

  useEffect(() => {
    if (onLogin) return;
    const u = api.getUser();
    if (!u) router.replace("/login");
    else setName(u.name);
  }, [onLogin, router]);

  if (onLogin) return null;
  return (
    <nav className="topbar px-4 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div className="d-flex align-items-center gap-3">
        <strong>StudyPilot</strong>
        <Link href="/" className="toplink active">Planner</Link>
      </div>
      <div className="d-flex align-items-center gap-3 small">
        <span>{name}</span>
        <button className="btn btn-sm btn-outline-light" onClick={() => { api.logout(); router.push("/login"); }}>Log out</button>
      </div>
    </nav>
  );
}