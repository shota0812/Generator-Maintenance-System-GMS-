
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
  user: User;
};

type Assignment = {
  id: number;
  job_id: number;
  user_id: number;
  user: User;
};

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<DateApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // データ取得
  // =========================

  const loadData = async () => {
    try {
      const [
        jobsResponse,
        applicationsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/jobs`),
        axios.get(`${API_URL}/date-applications`),
        axios.get(`${API_URL}/assignments`),
      ]);

      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);
      setAssignments(assignmentsResponse.data);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    }
  };

  // =========================
  // 申請の承認・却下
  // =========================

  const updateApplicationStatus = async (
    applicationId: number,
    status: string
  ) => {
    try {
      await axios.put(
        `${API_URL}/date-applications/${applicationId}/status`,
        null,
        {
          params: { status },
        }
      );

      await loadData();

      alert(
        status === "承認"
          ? "日付申請を承認しました"
          : "日付申請を却下しました"
      );
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました");
    }
  };

  // =========================
  // 案件への担当者割り当て
  // =========================

  const createAssignment = async (
    jobId: number,
    userId: number
  ) => {
    try {
      await axios.post(`${API_URL}/assignments`, {
        job_id: jobId,
        user_id: userId,
      });

      await loadData();
      alert("担当者を割り当てました");
    } catch (error) {
      console.error(error);
      alert("割り当てに失敗しました");
    }
  };

  // =========================
  // 割り当て解除
  // =========================

  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm("この担当者の割り当てを解除しますか？")) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/assignments/${assignmentId}`
      );

      await loadData();
      alert("割り当てを解除しました");
    } catch (error) {
      console.error(error);
      alert("割り当て解除に失敗しました");
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

  const getAssignmentsByJob = (jobId: number) => {
    return assignments.filter(
      (assignment) => assignment.job_id === jobId
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
              日付別参加申請・担当者割り当て
            </h1>

            <p className="mt-2 text-gray-600">
              日付申請を承認し、各案件に担当者を割り当てます。
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
              onChange={(e) => setSelectedDate(e.target.value)}
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
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              更新
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
              const dayApplications = getApplicationsByDate(date);

              const approvedApplicants = dayApplications.filter(
                (application) => application.status === "承認"
              );

              return (
                <section
                  key={date}
                  className="rounded-lg bg-white p-6 shadow"
                >
                  <div className="mb-5 border-b pb-4">
                    <h2 className="text-2xl font-bold">
                      {date}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      案件 {dayJobs.length}件 /
                      申請 {dayApplications.length}件 /
                      承認済み {approvedApplicants.length}人
                    </p>
                  </div>

                  {/* 申請者一覧 */}
                  <div className="mb-6">
                    <h3 className="mb-3 font-bold">
                      参加申請者
                    </h3>

                    {dayApplications.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-5 text-center text-gray-500">
                        この日の申請者はいません。
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dayApplications.map((application) => (
                          <div
                            key={application.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-bold">
                                {application.user?.name ?? "不明"}
                              </p>

                              <p className="text-sm text-gray-500">
                                {application.user?.company ?? "会社不明"}
                              </p>

                              <p className="mt-2 text-sm">
                                状態：{application.status}
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
                                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
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
                                  className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                                >
                                  却下
                                </button>
                              </div>
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 案件ごとの担当者割り当て */}
                  <div className="border-t pt-5">
                    <h3 className="mb-4 text-xl font-bold">
                      案件ごとの担当者割り当て
                    </h3>

                    {dayJobs.map((job) => {
                      const jobAssignments = getAssignmentsByJob(job.id);

                      const availableApplicants =
                        approvedApplicants.filter(
                          (application) =>
                            !jobAssignments.some(
                              (assignment) =>
                                assignment.user_id === application.user_id
                            )
                        );

                      return (
                        <div
                          key={job.id}
                          className="mb-5 rounded-lg border p-5"
                        >
                          <h4 className="text-lg font-bold">
                            {job.customer}
                          </h4>

                          <p className="mt-1 text-sm text-gray-600">
                            {job.work}
                          </p>

                          {/* 割り当て済み担当者 */}
                          <div className="mt-4">
                            <p className="mb-2 font-semibold">
                              割り当て済み担当者
                            </p>

                            {jobAssignments.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                まだ割り当てられていません。
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {jobAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-green-50 p-3"
                                  >
                                    <div>
                                      <p className="font-semibold text-green-800">
                                        {assignment.user?.name ?? "不明"}
                                      </p>

                                      <p className="text-sm text-green-700">
                                        {assignment.user?.company ?? "会社不明"}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() =>
                                        deleteAssignment(assignment.id)
                                      }
                                      className="text-sm text-red-600 underline"
                                    >
                                      割り当て解除
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 新規割り当て */}
                          <div className="mt-5 border-t pt-4">
                            <p className="mb-3 font-semibold">
                              承認済み外注から担当者を追加
                            </p>

                            {approvedApplicants.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                この日の承認済み申請者はいません。
                              </p>
                            ) : availableApplicants.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                承認済み申請者は全員割り当て済みです。
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {availableApplicants.map((application) => (
                                  <div
                                    key={application.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                                  >
                                    <div>
                                      <p className="font-semibold">
                                        {application.user?.name ?? "不明"}
                                      </p>

                                      <p className="text-sm text-gray-500">
                                        {application.user?.company ?? "会社不明"}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() =>
                                        createAssignment(
                                          job.id,
                                          application.user_id
                                        )
                                      }
                                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                    >
                                      この案件に割り当て
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
