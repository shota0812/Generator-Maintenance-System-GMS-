
"use client";

import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = "https://gms-backend-iazu.onrender.com";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
};

type User = {
  id: number;
  name: string;
  company: string;
  role: string;
};

type DateApplication = {
  id: number;
  date: string;
  user_id: number;
  status: string;
  available_people: number;
  confirmed_people: number;
  user: User;
};

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<DateApplication[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [confirmedCounts, setConfirmedCounts] = useState<{
    [key: number]: number;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // データ取得
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);

      const [jobsResponse, applicationsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/jobs`),
          axios.get(`${API_URL}/date-applications`),
        ]);

      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);

      const counts: { [key: number]: number } = {};

      applicationsResponse.data.forEach(
        (application: DateApplication) => {
          counts[application.id] = application.confirmed_people;
        }
      );

      setConfirmedCounts(counts);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 申請の承認・却下
  // =========================

  const updateApplicationStatus = async (
    applicationId: number,
    status: string
  ) => {
    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application) return;

    let confirmedPeople = 0;

    if (status === "承認") {
      confirmedPeople =
        confirmedCounts[applicationId] ?? 0;

      if (
        confirmedPeople < 1 ||
        confirmedPeople > application.available_people
      ) {
        alert(
          `確定人数は1人以上、参加可能人数（${application.available_people}人）以下にしてください。`
        );
        return;
      }

      if (
        !confirm(
          `${application.user.company}に${confirmedPeople}人の依頼を確定しますか？`
        )
      ) {
        return;
      }
    } else {
      if (
        !confirm(
          `${application.user.company}には今回は依頼しないことでよろしいですか？`
        )
      ) {
        return;
      }
    }

    try {
      await axios.put(
        `${API_URL}/date-applications/${applicationId}/status`,
        {
          status,
          confirmed_people: confirmedPeople,
        }
      );

      await loadData();

      alert(
        status === "承認"
          ? "依頼人数を確定しました"
          : "今回は依頼しないことにしました"
      );
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました");
    }
  };

  // =========================
  // 承認後の確定人数変更
  // =========================

  const updateConfirmedPeople = async (
    applicationId: number
  ) => {
    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application) return;

    const confirmedPeople =
      confirmedCounts[applicationId] ?? 0;

    if (
      confirmedPeople < 1 ||
      confirmedPeople > application.available_people
    ) {
      alert(
        `確定人数は1人以上、参加可能人数（${application.available_people}人）以下にしてください。`
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/date-applications/${applicationId}/confirmed-people`,
        null,
        {
          params: {
            confirmed_people: confirmedPeople,
          },
        }
      );

      await loadData();
      alert("確定人数を変更しました");
    } catch (error) {
      console.error(error);
      alert("確定人数の変更に失敗しました");
    }
  };

  // =========================
  // 表示用データ
  // =========================

  const jobDates = Array.from(
    new Set(jobs.map((job) => job.date))
  ).sort();

  const datesToShow = selectedDate
    ? [selectedDate]
    : jobDates;

  const getJobsByDate = (date: string) => {
    return jobs.filter((job) => job.date === date);
  };

  const getApplicationsByDate = (date: string) => {
    return applications.filter(
      (application) => application.date === date
    );
  };

  const pendingCount = applications.filter(
    (application) => application.status === "申請中"
  ).length;

  // =========================
  // 画面
  // =========================

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              日付別参加申請・人数管理
            </h1>

            <p className="mt-2 text-gray-600">
              会社ごとの参加可能人数を確認し、依頼人数を確定します。
            </p>
          </div>

          <a
            href="/"
            className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            カレンダーへ戻る
          </a>
        </div>

        {/* 承認待ち件数 */}
        <div className="mb-6 rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            承認待ちの申請
          </p>

          <p className="mt-1 text-3xl font-bold text-blue-700">
            {pendingCount}件
          </p>
        </div>

        {/* 日付選択 */}
        <div className="mb-6 rounded-lg bg-white p-5 shadow">
          <label className="mb-2 block font-semibold">
            表示する日付
          </label>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
              className="min-w-[220px] rounded-lg border p-3"
            >
              <option value="">すべての日付</option>

              {jobDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "更新中..." : "更新"}
            </button>
          </div>
        </div>

        {/* 日付別一覧 */}
        {datesToShow.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow">
            <p className="text-gray-500">
              案件が登録されている日付はありません。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {datesToShow.map((date) => {
              const dayJobs = getJobsByDate(date);
              const dayApplications =
                getApplicationsByDate(date);

              const approvedApplications =
                dayApplications.filter(
                  (application) =>
                    application.status === "承認"
                );

              const totalAvailable =
                dayApplications.reduce(
                  (sum, application) =>
                    sum + application.available_people,
                  0
                );

              const totalConfirmed =
                approvedApplications.reduce(
                  (sum, application) =>
                    sum + application.confirmed_people,
                  0
                );

              return (
                <section
                  key={date}
                  className="rounded-lg bg-white p-6 shadow"
                >
                  {/* 日付ヘッダー */}
                  <div className="mb-5 border-b pb-4">
                    <h2 className="text-2xl font-bold">
                      {date}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      案件 {dayJobs.length}件 /
                      申請 {dayApplications.length}社
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">
                          参加可能人数
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {totalAvailable}人
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-sm text-gray-500">
                          依頼確定人数
                        </p>
                        <p className="mt-1 text-2xl font-bold text-green-700">
                          {totalConfirmed}人
                        </p>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-gray-500">
                          承認待ち
                        </p>
                        <p className="mt-1 text-2xl font-bold text-blue-700">
                          {
                            dayApplications.filter(
                              (application) =>
                                application.status === "申請中"
                            ).length
                          }社
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 案件一覧 */}
                  <div className="mb-6">
                    <h3 className="mb-3 font-bold">
                      当日の案件
                    </h3>

                    <div className="space-y-2">
                      {dayJobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-lg bg-gray-50 p-4"
                        >
                          <p className="font-semibold">
                            {job.customer}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {job.work}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 会社ごとの申請 */}
                  <div className="border-t pt-5">
                    <h3 className="mb-4 text-xl font-bold">
                      会社ごとの参加申請
                    </h3>

                    {dayApplications.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-5 text-center text-gray-500">
                        この日の申請者はいません。
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {dayApplications.map((application) => (
                          <div
                            key={application.id}
                            className="rounded-lg border p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-bold">
                                  {application.user?.company ??
                                    "会社不明"}
                                </p>

                                <p className="text-sm text-gray-500">
                                  申請担当者：
                                  {application.user?.name ?? "不明"}
                                </p>
                              </div>

                              {application.status === "申請中" && (
                                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                                  承認待ち
                                </span>
                              )}

                              {application.status === "承認" && (
                                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                                  依頼確定
                                </span>
                              )}

                              {application.status === "却下" && (
                                <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                                  今回は依頼なし
                                </span>
                              )}
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="rounded-lg bg-gray-50 p-4">
                                <p className="text-sm text-gray-500">
                                  参加可能人数
                                </p>
                                <p className="mt-1 text-2xl font-bold">
                                  {application.available_people}人
                                </p>
                              </div>

                              <div className="rounded-lg bg-green-50 p-4">
                                <p className="text-sm text-gray-500">
                                  確定人数
                                </p>
                                <p className="mt-1 text-2xl font-bold text-green-700">
                                  {application.confirmed_people}人
                                </p>
                              </div>
                            </div>

                            {/* 承認待ち */}
                            {application.status === "申請中" && (
                              <div className="mt-5 border-t pt-4">
                                <label className="mb-2 block font-semibold">
                                  依頼する人数
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                  <input
                                    type="number"
                                    min="1"
                                    max={application.available_people}
                                    value={
                                      confirmedCounts[
                                        application.id
                                      ] ?? ""
                                    }
                                    onChange={(e) =>
                                      setConfirmedCounts(
                                        (prev) => ({
                                          ...prev,
                                          [application.id]:
                                            Number(e.target.value),
                                        })
                                      )
                                    }
                                    className="w-28 rounded-lg border p-3"
                                  />

                                  <span className="text-sm text-gray-500">
                                    人（最大
                                    {application.available_people}
                                    人）
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      updateApplicationStatus(
                                        application.id,
                                        "承認"
                                      )
                                    }
                                    className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                                  >
                                    依頼確定
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateApplicationStatus(
                                        application.id,
                                        "却下"
                                      )
                                    }
                                    className="rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
                                  >
                                    今回は依頼しない
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 承認後の人数変更 */}
                            {application.status === "承認" && (
                              <div className="mt-5 border-t pt-4">
                                <label className="mb-2 block font-semibold">
                                  確定人数の変更
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                  <input
                                    type="number"
                                    min="1"
                                    max={application.available_people}
                                    value={
                                      confirmedCounts[
                                        application.id
                                      ] ?? application.confirmed_people
                                    }
                                    onChange={(e) =>
                                      setConfirmedCounts(
                                        (prev) => ({
                                          ...prev,
                                          [application.id]:
                                            Number(e.target.value),
                                        })
                                      )
                                    }
                                    className="w-28 rounded-lg border p-3"
                                  />

                                  <span className="text-sm text-gray-500">
                                    人
                                  </span>

                                  <button
                                    onClick={() =>
                                      updateConfirmedPeople(
                                        application.id
                                      )
                                    }
                                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                                  >
                                    人数を変更
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 却下後 */}
                            {application.status === "却下" && (
                              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                この会社への依頼はありません。確定人数は0人です。
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
