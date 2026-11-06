
"use client";

import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = "https://gms-backend-iazu.onrender.com";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
  status: string;
};

type DateApplication = {
  id: number;
  date: string;
  user_id: number;
  status: string;
};

type Assignment = {
  id: number;
  job_id: number;
  user_id: number;
};

type PersonalEvent = {
  id: number;
  user_id: number;
  date: string;
  title: string;
  description: string | null;
};

export default function ContractorPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dateApplications, setDateApplications] = useState<DateApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);

  const [userId, setUserId] = useState<number | null>(null);
  const [userCompany, setUserCompany] = useState("");
  const [userName, setUserName] = useState("");

  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const [selectedDate, setSelectedDate] = useState("");

  const [showPersonalEventForm, setShowPersonalEventForm] = useState(false);
  const [personalEventDate, setPersonalEventDate] = useState("");
  const [personalEventTitle, setPersonalEventTitle] = useState("");
  const [personalEventDescription, setPersonalEventDescription] = useState("");

  // =========================
  // データ取得
  // =========================

  const loadData = async (targetUserId: number) => {
    try {
      const [
        jobsResponse,
        applicationsResponse,
        assignmentsResponse,
        personalEventsResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/jobs`),
        axios.get(`${API_URL}/date-applications`),
        axios.get(`${API_URL}/assignments`),
        axios.get(`${API_URL}/personal-events/`, {
          params: {
            user_id: targetUserId,
          },
        }),
      ]);

      setJobs(jobsResponse.data);
      setDateApplications(applicationsResponse.data);
      setAssignments(assignmentsResponse.data);
      setPersonalEvents(personalEventsResponse.data);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    }
  };

  // =========================
  // ログインユーザー情報
  // =========================

  useEffect(() => {
    const savedUserId = sessionStorage.getItem("userId");

    if (!savedUserId) {
      window.location.href = "/account";
      return;
    }

    const parsedUserId = Number(savedUserId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      sessionStorage.clear();
      window.location.href = "/account";
      return;
    }

    setUserId(parsedUserId);
    setUserCompany(sessionStorage.getItem("userCompany") || "");
    setUserName(sessionStorage.getItem("userName") || "");

    loadData(parsedUserId);
  }, []);

  // =========================
  // 日付申請
  // =========================

  const getDateApplication = (date: string) => {
    return dateApplications.find(
      (application) =>
        application.date === date &&
        application.user_id === userId
    );
  };

  const applyForDate = async (date: string) => {
    if (userId === null) {
      alert("ログインしてください");
      return;
    }

    try {
      await axios.post(`${API_URL}/date-applications`, {
        date,
        user_id: userId,
      });

      await loadData(userId);
      alert(`${date}の参加申請をしました`);
    } catch (error) {
      console.error(error);
      alert("日付申請に失敗しました。すでに申請済みの可能性があります。");
    }
  };

  // =========================
  // 個人予定の追加
  // =========================

  const addPersonalEvent = async () => {
    if (userId === null) {
      alert("ログインしてください");
      return;
    }

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

      await loadData(userId);
      alert("個人予定を追加しました");
    } catch (error) {
      console.error(error);
      alert("個人予定の追加に失敗しました");
    }
  };

  // =========================
  // 個人予定の削除
  // =========================

  const deletePersonalEvent = async (eventId: number) => {
    if (userId === null) return;

    if (!confirm("この個人予定を削除しますか？")) return;

    try {
      await axios.delete(`${API_URL}/personal-events/${eventId}`, {
        params: {
          user_id: userId,
        },
      });

      await loadData(userId);
    } catch (error) {
      console.error(error);
      alert("個人予定の削除に失敗しました");
    }
  };

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

  const daysInMonth = new Date(
    currentYear,
    currentMonth,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    currentYear,
    currentMonth - 1,
    1
  ).getDay();

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // =========================
  // 表示用データ
  // =========================

  const monthlyJobs = jobs.filter((job) => {
    const date = new Date(`${job.date}T00:00:00`);

    return (
      date.getFullYear() === currentYear &&
      date.getMonth() + 1 === currentMonth &&
      (job.status === "予定" || job.status === "確定")
    );
  });

  const jobDates = Array.from(
    new Set(monthlyJobs.map((job) => job.date))
  );

  const selectedDateJobs = jobs.filter(
    (job) =>
      job.date === selectedDate &&
      (job.status === "予定" || job.status === "確定")
  );

  const myAssignments = assignments
    .filter((assignment) => assignment.user_id === userId)
    .map((assignment) => ({
      assignment,
      job: jobs.find((job) => job.id === assignment.job_id),
    }))
    .filter((item) => item.job !== undefined);

  const myDateApplications = dateApplications
    .filter((application) => application.user_id === userId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const selectedApplication = getDateApplication(selectedDate);

  // =========================
  // 画面
  // =========================

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* ユーザー情報 */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-blue-700">
            ようこそ、{userCompany} {userName}さん
          </p>
        </div>

        <h1 className="mb-2 text-4xl font-bold">
          案件カレンダー
        </h1>

        <p className="mb-8 text-gray-600">
          参加可能な日付を選択して、一括で参加申請できます。
        </p>

        {/* 月切り替え */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            ← 前月
          </button>

          <h2 className="text-3xl font-bold">
            {currentYear}年{currentMonth}月
          </h2>

          <button
            onClick={goToNextMonth}
            className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            次月 →
          </button>
        </div>

        {/* カレンダー */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">
            全体カレンダー
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((weekday, index) => (
              <div
                key={weekday}
                className={`p-2 text-center font-bold ${
                  index === 0
                    ? "text-red-600"
                    : index === 6
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {weekday}
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateString =
                `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const dayJobs = monthlyJobs.filter(
                (job) => job.date === dateString
              );

              const application = getDateApplication(dateString);

              const isSelected = selectedDate === dateString;

              return (
                <button
                  key={dateString}
                  onClick={() => setSelectedDate(dateString)}
                  className={`min-h-[110px] rounded-lg border p-2 text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-100 ring-2 ring-blue-400"
                      : dayJobs.length > 0
                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="mb-2 font-bold">
                    {day}日
                  </div>

                  {dayJobs.length > 0 && (
                    <div className="text-xs text-blue-800">
                      {dayJobs.length}件の案件
                    </div>
                  )}

                  {application && (
                    <div className={`mt-2 rounded px-1 py-1 text-center text-[10px] ${
                      application.status === "承認"
                        ? "bg-green-100 text-green-700"
                        : application.status === "却下"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {application.status === "承認"
                        ? "承認済み"
                        : application.status === "却下"
                        ? "却下"
                        : "申請中"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            日付をクリックすると、その日の案件と申請状況を確認できます。
          </p>
        </div>

        {/* 選択した日付の詳細 */}
        {selectedDate && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">
              {selectedDate}の案件
            </h2>

            {selectedDateJobs.length === 0 ? (
              <p className="text-gray-500">
                この日に案件はありません。
              </p>
            ) : (
              <div className="mb-6 space-y-3">
                {selectedDateJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border p-4"
                  >
                    <p className="font-bold">{job.customer}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {job.work}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      状態：{job.status}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedDateJobs.length > 0 && (
              <div className="border-t pt-5">
                {!selectedApplication && (
                  <button
                    onClick={() => applyForDate(selectedDate)}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    この日の参加を申請する
                  </button>
                )}

                {selectedApplication?.status === "申請中" && (
                  <span className="rounded-lg bg-yellow-100 px-5 py-3 font-semibold text-yellow-700">
                    申請中
                  </span>
                )}

                {selectedApplication?.status === "承認" && (
                  <span className="rounded-lg bg-green-100 px-5 py-3 font-semibold text-green-700">
                    参加承認済み
                  </span>
                )}

                {selectedApplication?.status === "却下" && (
                  <div>
                    <p className="mb-3 text-red-600">
                      この日の申請は却下されました。
                    </p>
                    <button
                      onClick={() => applyForDate(selectedDate)}
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      再申請する
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 自分の申請状況 */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">
            自分の日付申請
          </h2>

          {myDateApplications.length === 0 ? (
            <p className="text-gray-500">
              まだ日付申請していません。
            </p>
          ) : (
            <div className="space-y-3">
              {myDateApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <p className="font-semibold">
                    {application.date}
                  </p>

                  <span className={`rounded-full px-4 py-2 text-sm ${
                    application.status === "承認"
                      ? "bg-green-100 text-green-700"
                      : application.status === "却下"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {application.status === "承認"
                      ? "承認済み"
                      : application.status === "却下"
                      ? "却下"
                      : "申請中"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 割り当てられた案件 */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">
            自分に割り当てられた案件
          </h2>

          {myAssignments.length === 0 ? (
            <p className="text-gray-500">
              現在、割り当てられた案件はありません。
            </p>
          ) : (
            <div className="space-y-3">
              {myAssignments.map(({ assignment, job }) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border p-4"
                >
                  <p className="font-bold">
                    {job!.customer}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {job!.date} / {job!.work}
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                    担当確定
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 個人予定 */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                自分の予定
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                自分のカレンダーだけに表示される予定です。
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
                  onChange={(e) => setPersonalEventDate(e.target.value)}
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
                  onChange={(e) => setPersonalEventTitle(e.target.value)}
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
                  onChange={(e) => setPersonalEventDescription(e.target.value)}
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

          <div className="mt-5 space-y-3">
            {personalEvents.length === 0 ? (
              <p className="text-gray-500">
                個人予定はありません。
              </p>
            ) : (
              personalEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-bold">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.date}
                    </p>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deletePersonalEvent(event.id)}
                    className="text-sm text-red-600 underline"
                  >
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
