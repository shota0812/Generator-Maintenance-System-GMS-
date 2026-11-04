"use client";

import axios from "axios";
import { useEffect, useState } from "react";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
  technician: string;
  contractor: string;
  status: string;
  approval_status: string;
};

type Application = {
  id: number;
  job_id: number;
  user_id: number;
  status: string;
  user: {
    id: number;
    company: string;
    name: string;
    role: string;
  };
};

type PersonalEvent = {
  id: number;
  user_id: number;
  date: string;
  title: string;
  description: string | null;
};

type PendingUser = {
  id: number;
  company: string;
  name: string;
  email: string;
  role: string;
  approval_status: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [work, setWork] = useState("");
  const [technician, setTechnician] = useState("");
  const [contractor, setContractor] = useState("");
  const [status, setStatus] = useState("予定");

  const [search, setSearch] = useState("");

  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  const [showPersonalEventForm, setShowPersonalEventForm] = useState(false);
  const [personalEventDate, setPersonalEventDate] = useState("");
  const [personalEventTitle, setPersonalEventTitle] = useState("");
  const [personalEventDescription, setPersonalEventDescription] = useState("");

  // ログイン機能実装前の管理者ユーザーID
  const userId = 1;
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  // =========================
  // 月切り替え
  // =========================

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // =========================
  // 年切り替え
  // =========================

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  // =========================
  // 日付関係
  // =========================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
    ];

    return `${date.getMonth() + 1}月${date.getDate()}日（${
      weekdays[date.getDay()]
    }）`;
  };

  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();

    if (day === 0) {
      return "text-red-600";
    }

    if (day === 6) {
      return "text-blue-600";
    }

    return "text-gray-900";
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // =========================
  // データ読み込み
  // =========================

    const handleAdminLogin = async () => {
    try {
      setLoginError("");

      const response = await axios.post(
        "https://gms-backend-iazu.onrender.com/users/admin/login",
        {
          email: adminEmail,
          password: adminPassword,
        }
      );

      if (response.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setLoginError(
        "メールアドレスまたはパスワードが違います"
      );
    }
  };

    useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
  try {
    const jobsResponse = await axios.get(
      "https://gms-backend-iazu.onrender.com/jobs"
    );

    const applicationsResponse = await axios.get(
      "https://gms-backend-iazu.onrender.com/applications"
    );

    const personalEventsResponse = await axios.get(
      "https://gms-backend-iazu.onrender.com/personal-events/",
      {
        params: {
          user_id: userId,
        },
      }
    );

    const pendingUsersResponse = await axios.get(
      "https://gms-backend-iazu.onrender.com/users/pending"
    );

    setJobs(jobsResponse.data);
    setApplications(applicationsResponse.data);
    setPersonalEvents(personalEventsResponse.data);
    setPendingUsers(pendingUsersResponse.data);
  } catch (error) {
    console.error(error);
  }
};

// 外注ユーザーの承認・却下
const updateUserApproval = async (
  userId: number,
  status: string
) => {
  try {
    await axios.put(
      `https://gms-backend-iazu.onrender.com/users/${userId}/approval-status`,
      null,
      {
        params: {
          status,
        },
      }
    );

    await loadData();

    alert(
      status === "承認済み"
        ? "ユーザーを承認しました"
        : "ユーザーを却下しました"
    );
  } catch (error) {
    console.error(error);
    alert("ユーザーの承認処理に失敗しました");
  }
};

  // =========================
  // 参加申請の承認・却下
  // =========================

  // 個人予定を追加
const addPersonalEvent = async () => {
  if (!personalEventDate || !personalEventTitle.trim()) {
    alert("日付と予定名を入力してください");
    return;
  }

  try {
    await axios.post(
      "https://gms-backend-iazu.onrender.com/personal-events/",
      {
        user_id: userId,
        date: personalEventDate,
        title: personalEventTitle,
        description: personalEventDescription,
      }
    );

    setPersonalEventDate("");
    setPersonalEventTitle("");
    setPersonalEventDescription("");
    setShowPersonalEventForm(false);

    await loadData();

    alert("個人予定を追加しました");
  } catch (error) {
    console.error(error);
    alert("個人予定の追加に失敗しました");
  }
};

// 個人予定を削除
const deletePersonalEvent = async (eventId: number) => {
  if (!confirm("この個人予定を削除しますか？")) {
    return;
  }

  try {
    await axios.delete(
      `https://gms-backend-iazu.onrender.com/personal-events/${eventId}`,
      {
        params: {
          user_id: userId,
        },
      }
    );

    await loadData();
  } catch (error) {
    console.error(error);
    alert("個人予定の削除に失敗しました");
  }
};

  const updateApplicationStatus = async (
    applicationId: number,
    status: string
  ) => {
    try {
      await axios.put(
        `https://gms-backend-iazu.onrender.com/applications/${applicationId}/status`,
        null,
        {
          params: {
            status,
          },
        }
      );

      await loadData();

      alert(
        status === "承認"
          ? "参加者を承認しました"
          : "参加申請を却下しました"
      );
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました");
    }
  };

  // =========================
  // 月・検索による案件絞り込み
  // =========================

  const filteredJobs = jobs.filter((job) => {
  const jobDate = new Date(job.date);

  const customer = job.customer ?? "";
  const technician = job.technician ?? "";
  const contractor = job.contractor ?? "";

  return (
    jobDate.getFullYear() === currentYear &&
    jobDate.getMonth() + 1 === currentMonth &&
    (job.status === "確定" || job.status === "予定") &&
    (
      customer.includes(search) ||
      technician.includes(search) ||
      contractor.includes(search)
    )
  );
});

  // =========================
  // 日付ごとに案件をグループ化
  // =========================

  const groupedJobs = filteredJobs.reduce((acc, job) => {
    if (!acc[job.date]) {
      acc[job.date] = [];
    }

    acc[job.date].push(job);

    return acc;
  }, {} as Record<string, Job[]>);

  // =========================
  // 承認済み参加者
  // =========================

  const getApprovedApplications = (jobId: number) => {
    return applications.filter(
      (application) =>
        application.job_id === jobId &&
        application.status === "承認"
    );
  };

  // =========================
  // 案件編集
  // =========================

  const openEditModal = (job: Job) => {
    setEditingJob(job);

    setDate(job.date);
    setCustomer(job.customer);
    setWork(job.work);
    setTechnician(job.technician);
    setContractor(job.contractor);
    setStatus(job.status);

    setIsOpen(true);
  };

  // =========================
  // 案件削除
  // =========================

  const deleteJob = async (jobId: number) => {
    if (!confirm("この案件を削除しますか？")) {
      return;
    }

    try {
      await axios.delete(
        `https://gms-backend-iazu.onrender.com/jobs/${jobId}`
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };

  // =========================
  // 案件追加・編集
  // =========================

  const handleSubmit = async () => {
    try {
      const jobData = {
        date,
        customer,
        work,
        technician,
        contractor,
        status,
      };

      if (editingJob) {
        await axios.put(
          `https://gms-backend-iazu.onrender.com/jobs/${editingJob.id}`,
          jobData
        );
      } else {
        await axios.post(
          "https://gms-backend-iazu.onrender.com/jobs",
          jobData
        );
      }

      await loadData();

      setIsOpen(false);
      setEditingJob(null);

      setDate("");
      setCustomer("");
      setWork("");
      setTechnician("");
      setContractor("");
      setStatus("予定");
    } catch (error) {
      console.error(error);
      alert(
        editingJob
          ? "編集に失敗しました"
          : "登録に失敗しました"
      );
    }
  };

  if (!isAuthenticated) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">管理者ログイン</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="管理者メールアドレス"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full rounded border p-3"
          />

          <input
            type="password"
            placeholder="パスワード"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full rounded border p-3"
          />

          {loginError && (
            <p className="text-sm text-red-600">{loginError}</p>
          )}

          <button
            onClick={handleAdminLogin}
            className="w-full rounded bg-blue-600 p-3 text-white"
          >
            ログイン
          </button>
        </div>
      </div>
    </main>
  );
}
  return (
    <div className="mx-auto max-w-7xl p-6">

      {/* =========================
          タイトル
      ========================= */}

      <h1 className="mb-8 text-4xl font-bold">
        発電機保守管理システム
      </h1>

      {/* 外注ユーザーの承認 */}
<div className="mb-8 rounded-lg bg-white p-6 shadow">
  <h2 className="mb-4 text-2xl font-bold">
    外注ユーザー承認
  </h2>

  {pendingUsers.length === 0 ? (
    <p className="text-gray-500">
      現在、承認待ちのユーザーはいません。
    </p>
  ) : (
    <div className="space-y-4">
      {pendingUsers.map((user) => (
        <div
          key={user.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div>
            <p className="font-bold">
              {user.company}
            </p>

            <p>
              {user.name}
            </p>

            <p className="text-sm text-gray-500">
              {user.email}
            </p>

            <p className="mt-1 text-sm text-yellow-700">
              {user.approval_status}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                updateUserApproval(user.id, "承認済み")
              }
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              承認
            </button>

            <button
              onClick={() =>
                updateUserApproval(user.id, "却下")
              }
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              却下
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      {/* =========================
          月切り替え
      ========================= */}

      <div className="mb-8">

        <div className="mb-6 flex items-center justify-center gap-4">

          <button
            onClick={goToPreviousMonth}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            ← 前月
          </button>

          <h2 className="min-w-[180px] text-center text-2xl font-bold">
            {currentYear}年{currentMonth}月
          </h2>

          <button
            onClick={goToNextMonth}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            次月 →
          </button>

        </div>

        {/* =========================
            月選択
        ========================= */}

        <div className="flex flex-wrap justify-center gap-2">

          {Array.from(
            { length: 12 },
            (_, index) => index + 1
          ).map((month) => (

            <button
              key={month}
              onClick={() => setCurrentMonth(month)}
              className={`rounded px-4 py-2 font-medium ${
                currentMonth === month
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {month}月
            </button>

          ))}

        </div>

        {/* =========================
            年選択
        ========================= */}

        <div className="mt-4 flex items-center justify-center gap-4">

          <button
            onClick={goToPreviousYear}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            ← 前年
          </button>

          <span className="text-xl font-bold">
            {currentYear}年
          </span>

          <button
            onClick={goToNextYear}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            翌年 →
          </button>

        </div>

        {/* =========================
            表示切り替え
        ========================= */}

        <div className="mt-6 flex justify-center gap-2">

          <button
            onClick={() => setViewMode("list")}
            className={`rounded px-5 py-2 font-semibold ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            一覧表示
          </button>

          <button
            onClick={() => setViewMode("calendar")}
            className={`rounded px-5 py-2 font-semibold ${
              viewMode === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            カレンダー表示
          </button>

        </div>

      </div>

      {/* 個人予定 */}

<div className="mb-6 rounded-lg bg-white p-5 shadow">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold">管理者の個人予定</h2>
      <p className="mt-1 text-sm text-gray-500">
        管理者自身のカレンダーに表示される予定です。
      </p>
    </div>

    <button
      onClick={() =>
        setShowPersonalEventForm(!showPersonalEventForm)
      }
      className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
    >
      {showPersonalEventForm ? "閉じる" : "＋ 予定追加"}
    </button>
  </div>

  {showPersonalEventForm && (
    <div className="mt-5 space-y-4 border-t pt-5">
      <div>
        <label className="mb-1 block font-semibold">日付</label>
        <input
          type="date"
          value={personalEventDate}
          onChange={(e) => setPersonalEventDate(e.target.value)}
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-1 block font-semibold">予定名</label>
        <input
          type="text"
          value={personalEventTitle}
          onChange={(e) => setPersonalEventTitle(e.target.value)}
          placeholder="例：社内打ち合わせ"
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-1 block font-semibold">詳細（任意）</label>
        <textarea
          value={personalEventDescription}
          onChange={(e) =>
            setPersonalEventDescription(e.target.value)
          }
          placeholder="予定の詳細"
          className="w-full rounded border p-3"
        />
      </div>

      <button
        onClick={addPersonalEvent}
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        保存
      </button>
    </div>
  )}
</div>
      {/* =========================
          検索・案件追加
      ========================= */}

      <div className="mb-8 flex items-center justify-between">

        <input
          type="text"
          placeholder="顧客・担当者・外注で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-96 rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
        />

        <button
          onClick={() => {
            setEditingJob(null);

            setDate("");
            setCustomer("");
            setWork("");
            setTechnician("");
            setContractor("");
            setStatus("予定");

            setIsOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          ＋ 案件追加
        </button>
        <a
  href="/applications"
  className="ml-3 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
>
  参加申請一覧
</a>

      </div>

      

      {/* ==================================================
          一覧表示
      ================================================== */}

      {viewMode === "list" && (

        <div className="space-y-10">

          {Object.keys(groupedJobs).length === 0 ? (

            <div className="rounded-lg bg-white p-10 text-center shadow">

              <p className="text-xl font-semibold text-gray-500">
                {currentYear}年{currentMonth}月の案件はありません
              </p>

            </div>

          ) : (

            Object.entries(groupedJobs).map(
              ([date, dayJobs]) => (

                <section key={date}>

                  {/* 日付 */}

                  <h2
                    className={`mb-4 border-b-2 border-gray-300 pb-2 text-2xl font-bold ${getDateColor(
                      date
                    )}`}
                  >
                    {formatDate(date)}
                  </h2>

                  <table className="w-full overflow-hidden rounded-lg bg-white shadow">

                    <thead className="bg-gray-200">

                      <tr>

                        <th className="p-4 text-left">
                          顧客
                        </th>

                        <th className="p-4 text-left">
                          作業内容
                        </th>

                        <th className="p-4 text-left">
                          担当者
                        </th>

                        <th className="p-4 text-left">
                          外注
                        </th>

                        <th className="p-4 text-left">
                          状態
                        </th>

                        <th className="p-4 text-left">
                          承認
                        </th>

                        <th className="p-4 text-center">
                          操作
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {dayJobs.map((job) => (

                        <tr
                          key={job.id}
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-4">
                            {job.customer}
                          </td>

                          <td className="p-4">
                            {job.work}
                          </td>

                          <td className="p-4">

                            {getApprovedApplications(job.id).length === 0 ? (

                              <span>
                                {job.technician}
                              </span>

                            ) : (

                              <div>

                                <div>
                                  {job.technician}
                                </div>

                                {getApprovedApplications(
                                  job.id
                                ).map((application) => (

                                  <div
                                    key={application.id}
                                    className="mt-1 text-sm text-green-700"
                                  >
                                    参加：
                                    {application.user.name}
                                    <span className="ml-1 text-gray-500">
                                      ({application.user.company})
                                    </span>
                                  </div>

                                ))}

                              </div>

                            )}

                          </td>

                          <td className="p-4">
                            {job.contractor}
                          </td>

                          <td className="p-4">

                            <span
                              className={`rounded-full px-3 py-1 text-sm font-medium ${
                                job.status === "予定"
                                  ? "bg-blue-100 text-blue-700"
                                  : job.status === "完了"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {job.status}
                            </span>

                          </td>

                          <td className="p-4">

                            <span
                              className={`rounded-full px-3 py-1 text-sm font-medium ${
                                job.approval_status === "承認"
                                  ? "bg-green-100 text-green-700"
                                  : job.approval_status === "申請中"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : job.approval_status === "却下"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {job.approval_status}
                            </span>

                          </td>

                          <td className="p-4 text-center">

                            <button
                              onClick={() =>
                                openEditModal(job)
                              }
                              className="mr-2 rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                            >
                              編集
                            </button>

                            <button
                              onClick={() =>
                                deleteJob(job.id)
                              }
                              className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                            >
                              削除
                            </button>

                          </td>

                        </tr>

                      ))}

                    
                    {/* 管理者の個人予定 */}

<tr>
  <td className="sticky left-0 z-10 border border-gray-300 bg-green-100 p-3 font-bold">
    自分の予定
  </td>

  {Array.from(
    {
      length: getDaysInMonth(currentYear, currentMonth),
    },
    (_, index) => {
      const day = index + 1;

      const dateString =
        `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayEvents = personalEvents.filter(
        (event) => event.date === dateString
      );

      return (
        <td
          key={dateString}
          className="h-[120px] w-[110px] min-w-[110px] border border-gray-300 bg-green-50 p-1 align-top"
        >
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded border border-green-200 bg-green-100 p-2 text-xs text-green-800"
              >
                <div className="font-bold">
                  {event.title}
                </div>

                {event.description && (
                  <div className="mt-1 break-words">
                    {event.description}
                  </div>
                )}

                <button
                  onClick={() => deletePersonalEvent(event.id)}
                  className="mt-2 text-red-600 underline"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </td>
      );
    }
  )}
</tr>
                    </tbody>

                  </table>

                </section>

              )
            )

          )}

        </div>

      )}

      {/* ==================================================
    全体カレンダー
================================================== */}

{viewMode === "calendar" && (
  <div className="rounded-lg bg-white p-6 shadow">

    {/* タイトル */}
    <div className="mb-6 flex items-center justify-between">

      <div>
        <h2 className="text-2xl font-bold">
          全体カレンダー
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {currentYear}年{currentMonth}月の予定
        </p>
      </div>

      <div className="text-sm text-gray-500">
        案件をクリックすると編集できます
      </div>

    </div>


    {/* 横スクロール */}

    <div className="overflow-x-auto">

      <table className="min-w-[1800px] border-collapse border border-gray-300">

        <thead>

          <tr>

            {/* 顧客列 */}

            <th
              className="sticky left-0 z-20 w-[180px] min-w-[180px] border border-gray-300 bg-gray-200 p-3 text-left"
            >
              顧客
            </th>


            {/* 日付 */}

            {Array.from(
              {
                length: getDaysInMonth(
                  currentYear,
                  currentMonth
                ),
              },
              (_, index) => {

                const day = index + 1;

                const dayOfWeek = new Date(
                  currentYear,
                  currentMonth - 1,
                  day
                ).getDay();

                const weekday = [
                  "日",
                  "月",
                  "火",
                  "水",
                  "木",
                  "金",
                  "土",
                ][dayOfWeek];

                return (
                  <th
                    key={day}
                    className={`w-[110px] min-w-[110px] border border-gray-300 p-2 text-center ${
                      dayOfWeek === 0
                        ? "bg-red-50 text-red-600"
                        : dayOfWeek === 6
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-100"
                    }`}
                  >

                    <div className="font-bold">
                      {day}日
                    </div>

                    <div className="text-xs">
                      （{weekday}）
                    </div>

                  </th>
                );

              }
            )}

          </tr>

        </thead>


        <tbody>
  {(() => {
    const customerGroups = filteredJobs.reduce(
      (acc, job) => {
        const customer = job.customer || "未設定";

        if (!acc[customer]) {
          acc[customer] = [];
        }

        acc[customer].push(job);

        return acc;
      },
      {} as Record<string, Job[]>
    );

    return Object.entries(customerGroups).map(
      ([customer, customerJobs]) => (
        <tr key={customer}>
          <td className="sticky left-0 z-10 border border-gray-300 bg-white p-3 font-bold">
            {customer}
          </td>

          {Array.from(
            {
              length: getDaysInMonth(
                currentYear,
                currentMonth
              ),
            },
            (_, index) => {
              const day = index + 1;

              const dateString =
                `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const dayJobs = customerJobs.filter(
                (job) => job.date === dateString
              );

              return (
                <td
                  key={dateString}
                  className="h-[120px] w-[110px] min-w-[110px] border border-gray-300 p-1 align-top"
                >
                  <div className="space-y-1">
                    {dayJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => openEditModal(job)}
                        className="cursor-pointer rounded border border-blue-200 bg-blue-100 p-2 text-xs text-blue-800 hover:bg-blue-200"
                      >
                        <div className="font-bold">
                          {job.work || "作業予定"}
                        </div>

                        <div className="mt-1">
                          担当：{job.technician || "未設定"}
                        </div>

                        {job.contractor && (
                          <div>
                            外注：{job.contractor}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
              );
            }
          )}
        </tr>
      )
    );
  })()}

  {/* 管理者の個人予定 */}
  <tr>
    <td className="sticky left-0 z-10 border border-gray-300 bg-green-100 p-3 font-bold">
      管理者の予定
    </td>

    {Array.from(
      {
        length: getDaysInMonth(
          currentYear,
          currentMonth
        ),
      },
      (_, index) => {
        const day = index + 1;

        const dateString =
          `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayEvents = personalEvents.filter(
          (event) => event.date === dateString
        );

        return (
          <td
            key={dateString}
            className="h-[120px] w-[110px] min-w-[110px] border border-gray-300 bg-green-50 p-1 align-top"
          >
            <div className="space-y-1">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded border border-green-200 bg-green-100 p-2 text-xs text-green-800"
                >
                  <div className="font-bold">
                    {event.title}
                  </div>

                  {event.description && (
                    <div className="mt-1 break-words">
                      {event.description}
                    </div>
                  )}

                  <button
                    onClick={() =>
                      deletePersonalEvent(event.id)
                    }
                    className="mt-2 text-red-600 underline"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </td>
        );
      }
    )}
  </tr>
</tbody>
      </table>

    </div>


    {/* 説明 */}

    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">

      <div>
        <span className="mr-1 inline-block h-3 w-3 rounded bg-red-50 border border-red-200" />
        日曜日
      </div>

      <div>
        <span className="mr-1 inline-block h-3 w-3 rounded bg-blue-50 border border-blue-200" />
        土曜日
      </div>

      <div>
        案件をクリック → 編集
      </div>

    </div>

  </div>
)}

{/* =========================
          参加申請
      ========================= */}

      <div className="mb-10 rounded-lg bg-white p-6 shadow">

        <h2 className="mb-4 text-2xl font-bold">
          参加申請
        </h2>

        {applications.length === 0 ? (

          <p className="text-gray-500">
            現在、参加申請はありません。
          </p>

        ) : (

          <div className="space-y-4">

            {applications.map((application) => {

              const job = jobs.find(
                (job) => job.id === application.job_id
              );

              return (

                <div
                  key={application.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >

                  <div>

                    <p className="font-bold">
                      {job?.customer}
                    </p>

                    <p className="text-sm text-gray-600">
                      {job?.date} / {job?.work}
                    </p>

                    <p className="mt-2">
                      申請者：
                      <span className="font-semibold">
                        {application.user.name}
                      </span>

                      <span className="ml-2 text-gray-500">
                        ({application.user.company})
                      </span>
                    </p>

                    <p className="mt-1 text-sm">
                      状態：
                      {application.status}
                    </p>

                  </div>

                  {application.status === "申請中" && (

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          updateApplicationStatus(
                            application.id,
                            "承認"
                          )
                        }
                        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                      >
                        承認
                      </button>

                      <button
                        onClick={() =>
                          updateApplicationStatus(
                            application.id,
                            "却下"
                          )
                        }
                        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                      >
                        却下
                      </button>

                    </div>

                  )}

                </div>

              );

            })}

          </div>

        )}

      </div>

      {/* ==================================================
          案件追加・編集モーダル
      ================================================== */}

      {isOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">

            <h2 className="mb-6 text-2xl font-bold">
              {editingJob
                ? "案件編集"
                : "案件追加"}
            </h2>

            <div className="space-y-4">

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="顧客"
                value={customer}
                onChange={(e) =>
                  setCustomer(e.target.value)
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="作業内容"
                value={work}
                onChange={(e) =>
                  setWork(e.target.value)
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="担当者"
                value={technician}
                onChange={(e) =>
                  setTechnician(e.target.value)
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="外注"
                value={contractor}
                onChange={(e) =>
                  setContractor(e.target.value)
                }
                className="w-full rounded border p-2"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full rounded border p-2"
              >
                <option>予定</option>
                <option>調整中</option>
                <option>完了</option>
              </select>

              <button
                onClick={handleSubmit}
                className="mt-6 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
              >
                {editingJob
                  ? "変更を保存"
                  : "登録"}
              </button>

              <button
                onClick={() => {
                  setEditingJob(null);
                  setIsOpen(false);
                }}
                className="w-full rounded bg-gray-300 py-2 text-gray-800 hover:bg-gray-400"
              >
                閉じる
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}