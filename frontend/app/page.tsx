
"use client";

import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = "https://gms-backend-iazu.onrender.com";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
  technician: string | null;
  contractor: string | null;
  status: string;
};

type DateApplication = {
  id: number;
  date: string;
  user_id: number;
  status: string;
  user: {
    id: number;
    company: string;
    name: string;
    role: string;
  };
};

type Assignment = {
  id: number;
  job_id: number;
  user_id: number;
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
  const [dateApplications, setDateApplications] = useState<DateApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

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

  const [showPersonalEventForm, setShowPersonalEventForm] = useState(false);
  const [personalEventDate, setPersonalEventDate] = useState("");
  const [personalEventTitle, setPersonalEventTitle] = useState("");
  const [personalEventDescription, setPersonalEventDescription] = useState("");

  const userId = 1;
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  // カレンダーで選択した日付
  const [selectedDate, setSelectedDate] = useState("");

  // =========================
  // 月・年の切り替え
  // =========================

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate("");
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate("");
  };

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
    setSelectedDate("");
  };

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1);
    setSelectedDate("");
  };

  // =========================
  // 日付関係
  // =========================

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

    return `${month}月${day}日（${weekdays[date.getDay()]}）`;
  };

  const getDateColor = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    if (dayOfWeek === 0) return "text-red-600";
    if (dayOfWeek === 6) return "text-blue-600";

    return "text-gray-900";
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // =========================
  // ログイン
  // =========================

  const handleAdminLogin = async () => {
    try {
      setLoginError("");

      const response = await axios.post(
        `${API_URL}/users/admin/login`,
        {
          email: adminEmail,
          password: adminPassword,
        }
      );

      if (response.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error(error);
      setLoginError("メールアドレスまたはパスワードが違います");
    }
  };

  // =========================
  // データ読み込み
  // =========================

  const loadData = async () => {
    try {
      const [
        jobsResponse,
        dateApplicationsResponse,
        assignmentsResponse,
        personalEventsResponse,
        pendingUsersResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/jobs`),
        axios.get(`${API_URL}/date-applications`),
        axios.get(`${API_URL}/assignments`),
        axios.get(`${API_URL}/personal-events/`, {
          params: { user_id: userId },
        }),
        axios.get(`${API_URL}/users/pending`),
      ]);

      setJobs(jobsResponse.data);
      setDateApplications(dateApplicationsResponse.data);
      setAssignments(assignmentsResponse.data);
      setPersonalEvents(personalEventsResponse.data);
      setPendingUsers(pendingUsersResponse.data);
    } catch (error) {
      console.error(error);
      alert("データの読み込みに失敗しました");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // =========================
  // 外注ユーザーの承認・却下
  // =========================

  const updateUserApproval = async (
    targetUserId: number,
    approvalStatus: string
  ) => {
    try {
      await axios.put(
        `${API_URL}/users/${targetUserId}/approval-status`,
        null,
        {
          params: { status: approvalStatus },
        }
      );

      await loadData();

      alert(
        approvalStatus === "承認済み"
          ? "ユーザーを承認しました"
          : "ユーザーを却下しました"
      );
    } catch (error) {
      console.error(error);
      alert("ユーザーの承認処理に失敗しました");
    }
  };

  // =========================
  // 日付申請の承認・却下
  // =========================

  const updateDateApplicationStatus = async (
    applicationId: number,
    newStatus: string
  ) => {
    try {
      await axios.put(
        `${API_URL}/date-applications/${applicationId}/status`,
        null,
        {
          params: { status: newStatus },
        }
      );

      await loadData();

      alert(
        newStatus === "承認"
          ? "参加申請を承認しました"
          : "参加申請を却下しました"
      );
    } catch (error) {
      console.error(error);
      alert("参加申請の処理に失敗しました");
    }
  };

  // =========================
  // 案件ごとの担当者割り当て
  // =========================

  const createAssignment = async (
    jobId: number,
    targetUserId: number
  ) => {
    try {
      await axios.post(`${API_URL}/assignments`, {
        job_id: jobId,
        user_id: targetUserId,
      });

      await loadData();
      alert("担当者を割り当てました");
    } catch (error) {
      console.error(error);
      alert(
        "担当者の割り当てに失敗しました。申請が承認されているか確認してください。"
      );
    }
  };

  // =========================
  // 担当者の割り当て解除
  // =========================

  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm("この担当者の割り当てを解除しますか？")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}`);

      await loadData();
      alert("担当者の割り当てを解除しました");
    } catch (error) {
      console.error(error);
      alert("割り当て解除に失敗しました");
    }
  };

  const getJobAssignments = (jobId: number) => {
    return assignments.filter(
      (assignment) => assignment.job_id === jobId
    );
  };

  // =========================
  // 個人予定
  // =========================

  const addPersonalEvent = async () => {
    if (!personalEventDate || !personalEventTitle.trim()) {
      alert("日付と予定名を入力してください");
      return;
    }

    try {
      await axios.post(`${API_URL}/personal-events/`, {
        user_id: userId,
        date: personalEventDate,
        title: personalEventTitle,
        description: personalEventDescription,
      });

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

  const deletePersonalEvent = async (eventId: number) => {
    if (!confirm("この個人予定を削除しますか？")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/personal-events/${eventId}`, {
        params: { user_id: userId },
      });

      await loadData();
    } catch (error) {
      console.error(error);
      alert("個人予定の削除に失敗しました");
    }
  };

  // =========================
  // 案件の絞り込み
  // =========================

  const filteredJobs = jobs.filter((job) => {
    const jobDate = new Date(`${job.date}T00:00:00`);

    const customerName = job.customer ?? "";
    const technicianName = job.technician ?? "";
    const contractorName = job.contractor ?? "";

    return (
      jobDate.getFullYear() === currentYear &&
      jobDate.getMonth() + 1 === currentMonth &&
      (job.status === "確定" || job.status === "予定") &&
      (
        customerName.includes(search) ||
        technicianName.includes(search) ||
        contractorName.includes(search) ||
        job.work.includes(search)
      )
    );
  });

  // =========================
  // 日付ごとの案件
  // =========================

  const groupedJobs = filteredJobs.reduce((acc, job) => {
    if (!acc[job.date]) {
      acc[job.date] = [];
    }

    acc[job.date].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  // 選択した日の案件
  const selectedDayJobs = selectedDate
    ? jobs.filter(
        (job) =>
          job.date === selectedDate &&
          (job.status === "確定" || job.status === "予定") &&
          (
            (job.customer ?? "").includes(search) ||
            (job.technician ?? "").includes(search) ||
            (job.contractor ?? "").includes(search) ||
            job.work.includes(search)
          )
      )
    : [];

  // 選択した日の参加申請
  const selectedDateApplications = dateApplications.filter(
    (application) => application.date === selectedDate
  );

  // 選択した日の承認済み申請
  const approvedApplicants = selectedDateApplications.filter(
    (application) => application.status === "承認"
  );

  // =========================
  // 案件編集
  // =========================

  const openEditModal = (job: Job) => {
    setEditingJob(job);

    setDate(job.date);
    setCustomer(job.customer);
    setWork(job.work);
    setTechnician(job.technician ?? "");
    setContractor(job.contractor ?? "");
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
      await axios.delete(`${API_URL}/jobs/${jobId}`);
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
          `${API_URL}/jobs/${editingJob.id}`,
          jobData
        );
      } else {
        await axios.post(`${API_URL}/jobs`, jobData);
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
      setSelectedDate(date);
    } catch (error) {
      console.error(error);
      alert(
        editingJob
          ? "編集に失敗しました"
          : "登録に失敗しました"
      );
    }
  };

  // =========================
  // ログイン画面
  // =========================

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
          <h1 className="mb-6 text-2xl font-bold">
            管理者ログイン
          </h1>

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
              <p className="text-sm text-red-600">
                {loginError}
              </p>
            )}

            <button
              onClick={handleAdminLogin}
              className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700"
            >
              ログイン
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // 管理者画面
  // =========================

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold">
        発電機保守管理システム
      </h1>

      {/* =========================
          外注ユーザー承認
      ========================= */}

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
                  <p className="font-bold">{user.company}</p>
                  <p>{user.name}</p>
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
          月・年切り替え
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

        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 12 }, (_, index) => index + 1).map(
            (month) => (
              <button
                key={month}
                onClick={() => {
                  setCurrentMonth(month);
                  setSelectedDate("");
                }}
                className={`rounded px-4 py-2 font-medium ${
                  currentMonth === month
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {month}月
              </button>
            )
          )}
        </div>

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

      {/* =========================
          個人予定
      ========================= */}

      <div className="mb-6 rounded-lg bg-white p-5 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              管理者の個人予定
            </h2>
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
              <label className="mb-1 block font-semibold">
                日付
              </label>
              <input
                type="date"
                value={personalEventDate}
                onChange={(e) =>
                  setPersonalEventDate(e.target.value)
                }
                className="w-full rounded border p-3"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold">
                予定名
              </label>
              <input
                type="text"
                value={personalEventTitle}
                onChange={(e) =>
                  setPersonalEventTitle(e.target.value)
                }
                placeholder="例：社内打ち合わせ"
                className="w-full rounded border p-3"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold">
                詳細（任意）
              </label>
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

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="顧客・担当者・外注・作業内容で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
        />

        <div className="flex flex-wrap gap-3">
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
            className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            参加申請一覧
          </a>
        </div>
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
            Object.entries(groupedJobs).map(([jobDate, dayJobs]) => (
              <section key={jobDate}>
                <h2
                  className={`mb-4 border-b-2 border-gray-300 pb-2 text-2xl font-bold ${getDateColor(
                    jobDate
                  )}`}
                >
                  {formatDate(jobDate)}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full rounded-lg bg-white shadow">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-4 text-left">顧客</th>
                        <th className="p-4 text-left">作業内容</th>
                        <th className="p-4 text-left">担当者</th>
                        <th className="p-4 text-left">外注</th>
                        <th className="p-4 text-left">状態</th>
                        <th className="p-4 text-center">操作</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dayJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-4">{job.customer}</td>
                          <td className="p-4">{job.work}</td>

                          <td className="p-4">
                            <div>{job.technician || "未設定"}</div>
                            {getJobAssignments(job.id).map((assignment) => (
                              <div
                                key={assignment.id}
                                className="mt-1 text-sm text-green-700"
                              >
                                {assignment.user.name}
                                <span className="ml-1 text-gray-500">
                                  ({assignment.user.company})
                                </span>
                              </div>
                            ))}
                          </td>

                          <td className="p-4">
                            {job.contractor || "未設定"}
                          </td>

                          <td className="p-4">{job.status}</td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => openEditModal(job)}
                              className="mr-2 rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                            >
                              編集
                            </button>

                            <button
                              onClick={() => deleteJob(job.id)}
                              className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* ==================================================
          全体カレンダー
      ================================================== */}

      {viewMode === "calendar" && (
        <div className="rounded-lg bg-white p-6 shadow">
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
              日付をクリックすると、その日の案件を確認できます
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1800px] border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-[180px] min-w-[180px] border border-gray-300 bg-gray-200 p-3 text-left">
                    顧客
                  </th>

                  {Array.from(
                    { length: getDaysInMonth(currentYear, currentMonth) },
                    (_, index) => {
                      const day = index + 1;
                      const dateString = getDateString(day);
                      const dayOfWeek = new Date(
                        currentYear,
                        currentMonth - 1,
                        day
                      ).getDay();

                      const weekday = [
                        "日", "月", "火", "水", "木", "金", "土",
                      ][dayOfWeek];

                      const hasJobs = jobs.some(
                        (job) =>
                          job.date === dateString &&
                          (job.status === "予定" || job.status === "確定")
                      );

                      return (
                        <th
                          key={day}
                          className={`w-[110px] min-w-[110px] border border-gray-300 p-2 text-center ${
                            selectedDate === dateString
                              ? "bg-blue-200"
                              : dayOfWeek === 0
                              ? "bg-red-50 text-red-600"
                              : dayOfWeek === 6
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-100"
                          }`}
                        >
                          <button
                            onClick={() => setSelectedDate(dateString)}
                            className="w-full rounded p-1 hover:bg-blue-100"
                          >
                            <div className="font-bold">
                              {day}日
                            </div>
                            <div className="text-xs">
                              （{weekday}）
                            </div>
                            {hasJobs && (
                              <div className="mt-1 text-xs font-bold text-blue-700">
                                案件あり
                              </div>
                            )}
                          </button>
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
                      const customerName = job.customer || "未設定";

                      if (!acc[customerName]) {
                        acc[customerName] = [];
                      }

                      acc[customerName].push(job);
                      return acc;
                    },
                    {} as Record<string, Job[]>
                  );

                  return Object.entries(customerGroups).map(
                    ([customerName, customerJobs]) => (
                      <tr key={customerName}>
                        <td className="sticky left-0 z-10 border border-gray-300 bg-white p-3 font-bold">
                          {customerName}
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
                            const dateString = getDateString(day);

                            const dayJobs = customerJobs.filter(
                              (job) => job.date === dateString
                            );

                            return (
                              <td
                                key={dateString}
                                onClick={() => setSelectedDate(dateString)}
                                className={`h-[120px] w-[110px] min-w-[110px] cursor-pointer border border-gray-300 p-1 align-top ${
                                  selectedDate === dateString
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="space-y-1">
                                  {dayJobs.map((job) => (
                                    <div
                                      key={job.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(job);
                                      }}
                                      className="cursor-pointer rounded border border-blue-200 bg-blue-100 p-2 text-xs text-blue-800 hover:bg-blue-200"
                                    >
                                      <div className="font-bold">
                                        {job.work || "作業予定"}
                                      </div>

                                      <div className="mt-1">
                                        担当：{job.technician || "未設定"}
                                      </div>

                                      {getJobAssignments(job.id).map(
                                        (assignment) => (
                                          <div
                                            key={assignment.id}
                                            className="mt-1 text-green-700"
                                          >
                                            割当：{assignment.user.name}
                                          </div>
                                        )
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
                      const dateString = getDateString(day);

                      const dayEvents = personalEvents.filter(
                        (event) => event.date === dateString
                      );

                      return (
                        <td
                          key={dateString}
                          onClick={() => setSelectedDate(dateString)}
                          className={`h-[120px] w-[110px] min-w-[110px] cursor-pointer border border-gray-300 p-1 align-top ${
                            selectedDate === dateString
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
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

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="mr-1 inline-block h-3 w-3 rounded border border-red-200 bg-red-50" />
              日曜日
            </div>

            <div>
              <span className="mr-1 inline-block h-3 w-3 rounded border border-blue-200 bg-blue-50" />
              土曜日
            </div>

            <div>
              案件をクリック → 編集
            </div>

            <div>
              日付をクリック → 下に案件一覧を表示
            </div>
          </div>

          {/* ==================================================
              選択した日の案件・申請・割り当て
          ================================================== */}

          <div className="mt-8 border-t-4 border-blue-500 pt-6">
            {!selectedDate ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-lg font-semibold text-gray-600">
                  カレンダーの日付をクリックしてください
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  選択した日の案件と参加申請をここに表示します。
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {formatDate(selectedDate)} の案件管理
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      参加申請の承認と、案件ごとの担当者割り当てができます。
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setDate(selectedDate);
                      setEditingJob(null);
                      setCustomer("");
                      setWork("");
                      setTechnician("");
                      setContractor("");
                      setStatus("予定");
                      setIsOpen(true);
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    ＋ この日に案件追加
                  </button>
                </div>

                {/* その日の参加申請 */}
                <div className="mb-8 rounded-lg border bg-gray-50 p-5">
                  <h3 className="mb-4 text-xl font-bold">
                    この日の参加申請
                  </h3>

                  {selectedDateApplications.length === 0 ? (
                    <p className="text-gray-500">
                      この日の参加申請はありません。
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateApplications.map((application) => (
                        <div
                          key={application.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
                        >
                          <div>
                            <p className="font-bold">
                              {application.user.company}
                            </p>
                            <p>{application.user.name}</p>
                            <p className="mt-1 text-sm text-gray-600">
                              申請状態：
                              <span
                                className={
                                  application.status === "承認"
                                    ? "font-bold text-green-700"
                                    : application.status === "却下"
                                    ? "font-bold text-red-600"
                                    : "font-bold text-yellow-700"
                                }
                              >
                                {application.status}
                              </span>
                            </p>
                          </div>

                          {application.status === "申請中" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  updateDateApplicationStatus(
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
                                  updateDateApplicationStatus(
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

                          {application.status === "却下" && (
                            <span className="text-sm text-red-600">
                              却下済み
                            </span>
                          )}

                          {application.status === "承認" && (
                            <span className="text-sm font-semibold text-green-700">
                              案件への割り当てが可能です
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 案件ごとの割り当て */}
                <div>
                  <h3 className="mb-4 text-xl font-bold">
                    案件ごとの担当者割り当て
                  </h3>

                  {selectedDayJobs.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 p-8 text-center">
                      <p className="text-gray-500">
                        この日の案件はありません。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {selectedDayJobs.map((job) => {
                        const jobAssignments = getJobAssignments(job.id);

                        return (
                          <div
                            key={job.id}
                            className="rounded-lg border bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                              <div>
                                <h4 className="text-lg font-bold">
                                  {job.customer}
                                </h4>
                                <p className="mt-1 text-gray-700">
                                  {job.work}
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                  社内担当者：{job.technician || "未設定"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  外注：{job.contractor || "未設定"}
                                </p>
                                <p className="mt-1 text-sm">
                                  状態：{job.status}
                                </p>
                              </div>

                              <button
                                onClick={() => openEditModal(job)}
                                className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                              >
                                案件を編集
                              </button>
                            </div>

                            {/* 割り当て済み担当者 */}
                            <div className="mt-4">
                              <h5 className="mb-2 font-bold text-green-700">
                                割り当て済み担当者
                              </h5>

                              {jobAssignments.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  まだ担当者は割り当てられていません。
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {jobAssignments.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-green-200 bg-green-50 p-3"
                                    >
                                      <div>
                                        <span className="font-semibold">
                                          {assignment.user.name}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-600">
                                          {assignment.user.company}
                                        </span>
                                      </div>

                                      <button
                                        onClick={() =>
                                          deleteAssignment(assignment.id)
                                        }
                                        className="text-sm text-red-600 underline hover:text-red-800"
                                      >
                                        割り当て解除
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 割り当て可能な外注業者 */}
                            <div className="mt-5 border-t pt-4">
                              <h5 className="mb-2 font-bold">
                                承認済みの参加申請者から割り当て
                              </h5>

                              {approvedApplicants.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  この日に承認済みの参加申請者はいません。
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {approvedApplicants.map((applicant) => {
                                    const alreadyAssigned =
                                      jobAssignments.some(
                                        (assignment) =>
                                          assignment.user_id === applicant.user_id
                                      );

                                    return (
                                      <div
                                        key={applicant.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
                                      >
                                        <div>
                                          <span className="font-semibold">
                                            {applicant.user.name}
                                          </span>
                                          <span className="ml-2 text-sm text-gray-600">
                                            {applicant.user.company}
                                          </span>
                                        </div>

                                        {alreadyAssigned ? (
                                          <span className="text-sm font-semibold text-green-700">
                                            割り当て済み
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              createAssignment(
                                                job.id,
                                                applicant.user_id
                                              )
                                            }
                                            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                                          >
                                            この案件に割り当て
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          案件追加・編集モーダル
      ================================================== */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold">
              {editingJob ? "案件編集" : "案件追加"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-semibold">
                  日付
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  顧客
                </label>
                <input
                  type="text"
                  placeholder="顧客"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  作業内容
                </label>
                <input
                  type="text"
                  placeholder="作業内容"
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  社内担当者
                </label>
                <input
                  type="text"
                  placeholder="担当者"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  外注
                </label>
                <input
                  type="text"
                  placeholder="外注"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  状態
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded border p-2"
                >
                  <option>予定</option>
                  <option>調整中</option>
                  <option>確定</option>
                  <option>完了</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="mt-6 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
              >
                {editingJob ? "変更を保存" : "登録"}
              </button>

              {editingJob && (
                <button
                  onClick={() => deleteJob(editingJob.id)}
                  className="w-full rounded bg-red-500 py-2 text-white hover:bg-red-600"
                >
                  この案件を削除
                </button>
              )}

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
