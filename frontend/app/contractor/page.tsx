"use client";

import axios from "axios";
import { useEffect, useState } from "react";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
  required_people: number;
  status: string;
};

type Application = {
  id: number;
  job_id: number;
  user_id: number;
  status: string;
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);

  const [userId, setUserId] = useState<number | null>(null);

  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [showPersonalEventForm, setShowPersonalEventForm] = useState(false);
  const [personalEventDate, setPersonalEventDate] = useState("");
  const [personalEventTitle, setPersonalEventTitle] = useState("");
  const [personalEventDescription, setPersonalEventDescription] = useState("");

  // データ取得
  const loadData = async (targetUserId: number) => {
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
            user_id: targetUserId,
          },
        }
      );

      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);
      setPersonalEvents(personalEventsResponse.data);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    }
  };

  // ログインユーザーIDを読み込む
  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");

    if (!savedUserId) {
      window.location.href = "/account";
      return;
    }

    const parsedUserId = Number(savedUserId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      localStorage.removeItem("userId");
      window.location.href = "/account";
      return;
    }

    setUserId(parsedUserId);
    loadData(parsedUserId);
  }, []);

  // 参加申請
  const apply = async (jobId: number) => {
    if (userId === null) {
      alert("ログインしてください");
      return;
    }

    try {
      await axios.post(
        "https://gms-backend-iazu.onrender.com/applications",
        {
          job_id: jobId,
          user_id: userId,
        }
      );

      await loadData(userId);
      alert("参加申請しました");
    } catch (error) {
      console.error(error);
      alert("参加申請に失敗しました");
    }
  };

  // 前月
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 次月
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 指定した年月の日数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 自分の申請状況を取得
  const getApplication = (jobId: number) => {
    return applications.find(
      (application) =>
        application.job_id === jobId &&
        application.user_id === userId
    );
  };

  // 個人予定を追加
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

      await loadData(userId);

      alert("個人予定を追加しました");
    } catch (error) {
      console.error(error);
      alert("個人予定の追加に失敗しました");
    }
  };

  // 個人予定を削除
  const deletePersonalEvent = async (eventId: number) => {
    if (userId === null) {
      alert("ログインしてください");
      return;
    }

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

      await loadData(userId);
    } catch (error) {
      console.error(error);
      alert("個人予定の削除に失敗しました");
    }
  };

  // 現在の月の案件
  const monthlyJobs = jobs.filter((job) => {
    const jobDate = new Date(job.date);

    return (
      jobDate.getFullYear() === currentYear &&
      jobDate.getMonth() + 1 === currentMonth &&
      (job.status === "予定" || job.status === "確定")
    );
  });

  // 顧客ごとに案件をまとめる
  const customerGroups = monthlyJobs.reduce(
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

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        {/* タイトル */}
        <h1 className="mb-2 text-4xl font-bold">
          外注案件カレンダー
        </h1>

        <p className="mb-8 text-gray-600">
          案件の予定を確認して、参加したい案件へ申請できます。
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

        {/* 個人予定追加 */}
        <div className="mb-6 rounded-lg bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">自分の予定</h2>
              <p className="mt-1 text-sm text-gray-500">
                自分のカレンダーだけに表示される予定を登録できます。
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

        {/* 全体カレンダー */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">
              全体カレンダー
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              案件をクリックすると詳細を確認できます。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1800px] border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-[180px] min-w-[180px] border border-gray-300 bg-gray-200 p-3 text-left">
                    顧客
                  </th>

                  {Array.from(
                    { length: daysInMonth },
                    (_, index) => {
                      const day = index + 1;
                      const dayOfWeek = new Date(
                        currentYear,
                        currentMonth - 1,
                        day
                      ).getDay();

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
                          <div className="font-bold">{day}日</div>
                          <div className="text-xs">
                            （{weekdays[dayOfWeek]}）
                          </div>
                        </th>
                      );
                    }
                  )}
                </tr>
              </thead>

              <tbody>
                {Object.keys(customerGroups).length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="border border-gray-300 p-10 text-center text-gray-500"
                    >
                      {currentYear}年{currentMonth}月の案件はありません
                    </td>
                  </tr>
                ) : (
                  Object.entries(customerGroups).map(
                    ([customer, customerJobs]) => (
                      <tr key={customer}>
                        <td className="sticky left-0 z-10 border border-gray-300 bg-white p-3 font-bold">
                          {customer}
                        </td>

                        {Array.from(
                          { length: daysInMonth },
                          (_, index) => {
                            const day = index + 1;

                            const dateString =
                              `${currentYear}-${String(
                                currentMonth
                              ).padStart(2, "0")}-${String(
                                day
                              ).padStart(2, "0")}`;

                            const dayJobs = customerJobs.filter(
                              (job) => job.date === dateString
                            );

                            const dayOfWeek = new Date(
                              currentYear,
                              currentMonth - 1,
                              day
                            ).getDay();

                            return (
                              <td
                                key={dateString}
                                className={`h-[130px] w-[110px] min-w-[110px] border border-gray-300 p-1 align-top ${
                                  dayOfWeek === 0
                                    ? "bg-red-50/40"
                                    : dayOfWeek === 6
                                    ? "bg-blue-50/40"
                                    : "bg-white"
                                }`}
                              >
                                <div className="space-y-1">
                                  {dayJobs.map((job) => {
                                    const application =
                                      getApplication(job.id);

                                    return (
                                      <div
                                        key={job.id}
                                        onClick={() =>
                                          setSelectedJob(job)
                                        }
                                        className="cursor-pointer rounded-lg border border-blue-200 bg-blue-100 p-2 text-xs text-blue-800 transition hover:bg-blue-200"
                                      >
                                        <div className="font-bold">
                                          {job.work || "作業予定"}
                                        </div>

                                        <div className="mt-1">
                                          必要人数：
                                          {job.required_people}
                                          人
                                        </div>

                                        {application && (
                                          <div className="mt-2">
                                            {application.status ===
                                              "申請中" && (
                                              <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] text-yellow-700">
                                                申請中
                                              </span>
                                            )}

                                            {application.status ===
                                              "承認" && (
                                              <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] text-green-700">
                                                承認済み
                                              </span>
                                            )}

                                            {application.status ===
                                              "却下" && (
                                              <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] text-red-700">
                                                却下
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          }
                        )}
                      </tr>
                    )
                  )
                )}

                {/* 個人予定の行 */}
                <tr>
                  <td className="sticky left-0 z-10 border border-gray-300 bg-green-100 p-3 font-bold">
                    自分の予定
                  </td>

                  {Array.from(
                    { length: daysInMonth },
                    (_, index) => {
                      const day = index + 1;

                      const dateString =
                        `${currentYear}-${String(
                          currentMonth
                        ).padStart(2, "0")}-${String(
                          day
                        ).padStart(2, "0")}`;

                      const dayEvents = personalEvents.filter(
                        (event) => event.date === dateString
                      );

                      return (
                        <td
                          key={dateString}
                          className="h-[130px] w-[110px] min-w-[110px] border border-gray-300 bg-green-50 p-1 align-top"
                        >
                          <div className="space-y-1">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="rounded-lg border border-green-200 bg-green-100 p-2 text-xs text-green-800"
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

          {/* 凡例 */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
            <div>
              <span className="mr-1 inline-block h-3 w-3 rounded border border-red-200 bg-red-50" />
              日曜日
            </div>

            <div>
              <span className="mr-1 inline-block h-3 w-3 rounded border border-blue-200 bg-blue-50" />
              土曜日
            </div>

            <div>案件をクリックすると詳細を確認できます</div>
          </div>
        </div>

        {/* 案件詳細 */}
        {selectedJob && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">案件詳細</h2>

              <button
                onClick={() => setSelectedJob(null)}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold">日付：</span>
                {selectedJob.date}
              </div>

              <div>
                <span className="font-semibold">顧客：</span>
                {selectedJob.customer}
              </div>

              <div>
                <span className="font-semibold">作業内容：</span>
                {selectedJob.work}
              </div>

              <div>
                <span className="font-semibold">必要人数：</span>
                {selectedJob.required_people}人
              </div>

              <div>
                <span className="font-semibold">状態：</span>
                {selectedJob.status}
              </div>
            </div>

            {/* 参加申請 */}
            <div className="mt-6 border-t pt-6">
              {(() => {
                const application = getApplication(selectedJob.id);

                if (!application) {
                  return (
                    <button
                      onClick={() => apply(selectedJob.id)}
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      参加申請
                    </button>
                  );
                }

                if (application.status === "申請中") {
                  return (
                    <span className="rounded-full bg-yellow-100 px-5 py-3 text-yellow-700">
                      申請中
                    </span>
                  );
                }

                if (application.status === "承認") {
                  return (
                    <span className="rounded-full bg-green-100 px-5 py-3 text-green-700">
                      承認済み
                    </span>
                  );
                }

                if (application.status === "却下") {
                  return (
                    <span className="rounded-full bg-red-100 px-5 py-3 text-red-700">
                      却下
                    </span>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        )}

        {/* 自分の申請状況 */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">
            自分の参加申請
          </h2>

          {applications.filter(
            (application) => application.user_id === userId
          ).length === 0 ? (
            <p className="text-gray-500">
              まだ参加申請していません。
            </p>
          ) : (
            <div className="space-y-3">
              {applications
                .filter(
                  (application) => application.user_id === userId
                )
                .map((application) => {
                  const job = jobs.find(
                    (job) => job.id === application.job_id
                  );

                  if (!job) return null;

                  return (
                    <div
                      key={application.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-bold">{job.customer}</p>

                        <p className="text-sm text-gray-600">
                          {job.date}
                          {" / "}
                          {job.work}
                        </p>
                      </div>

                      <div>
                        {application.status === "申請中" && (
                          <span className="rounded-full bg-yellow-100 px-4 py-2 text-yellow-700">
                            申請中
                          </span>
                        )}

                        {application.status === "承認" && (
                          <span className="rounded-full bg-green-100 px-4 py-2 text-green-700">
                            承認済み
                          </span>
                        )}

                        {application.status === "却下" && (
                          <span className="rounded-full bg-red-100 px-4 py-2 text-red-700">
                            却下
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}