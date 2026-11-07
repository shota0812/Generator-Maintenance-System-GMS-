
"use client";

import axios from "axios";
import { useState } from "react";

const API_URL = "https://gms-backend-iazu.onrender.com";

export default function AccountPage() {
  const [mode, setMode] = useState<"register" | "login">("register");

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    try {
      if (mode === "register") {
        const response = await axios.post(`${API_URL}/users`, {
          company,
          name,
          email,
          password,
        });

        setMessage(
          `登録しました。現在の状態：${response.data.approval_status}`
        );
      } else {
        const response = await axios.post(
          `${API_URL}/users/login`,
          {
            email,
            password,
          }
        );

        // JWTトークンを保存
        sessionStorage.setItem(
          "contractorToken",
          response.data.access_token
        );

        // ログインユーザー情報を保存
        sessionStorage.setItem(
          "userId",
          String(response.data.user.id)
        );

        sessionStorage.setItem(
          "userRole",
          response.data.user.role
        );

        sessionStorage.setItem(
          "userCompany",
          response.data.user.company
        );

        sessionStorage.setItem(
          "userName",
          response.data.user.name
        );

        setMessage(
          `ログイン成功：${response.data.user.name} さん`
        );

        window.location.href = "/contractor";
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "通信エラーが発生しました"
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">
          発電機メンテナンスシステム
        </h1>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => {
              setMode("register");
              setMessage("");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            新規登録
          </button>

          <button
            onClick={() => {
              setMode("login");
              setMessage("");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            ログイン
          </button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="会社名"
                className="w-full rounded-lg border p-3"
              />

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="氏名"
                className="w-full rounded-lg border p-3"
              />
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full rounded-lg border p-3"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full rounded-lg border p-3"
          />

          <button
            onClick={handleSubmit}
            className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
          >
            {mode === "register"
              ? "アカウント登録"
              : "ログイン"}
          </button>

          {message && (
            <p className="rounded-lg bg-green-100 p-3 text-green-800">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-red-800">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
