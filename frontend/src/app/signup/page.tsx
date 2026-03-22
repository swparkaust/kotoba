"use client";

import { useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.post("/sessions/signup", { display_name: name, email, password });
      setAuthToken(data.auth_token);
      router.push("/dashboard");
    } catch {
      setError("Could not create account");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 space-y-6">
      <h1 className="text-2xl font-bold text-stone-800 text-center">ことば</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          className="w-full rounded-xl border border-stone-200 p-3"
        />
        <input
          data-testid="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-stone-200 p-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-stone-200 p-3"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-orange-500 py-3 text-white">
          Sign up
        </button>
      </form>
    </div>
  );
}
