"use client";

import axios from "axios";
import { useEffect, useState } from "react";

type Job = {
  id: number;
  date: string;
  customer: string;
  work: string;
};

type Application = {
  id: number;
  job_id: number;
  user_id: number;
  status: string;
  user: {
    name: string;
    company: string;
  };
};

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const jobsResponse = await axios.get(
        "http://127.0.0.1:8000/jobs"
      );

      const applicationsResponse = await axios.get(
        "http://127.0.0.1:8000/applications"
      );

      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);
    } catch (error) {
      console.error(error);
      alert("データの取得に失敗しました");
    }
  };

  const updateApplicationStatus = async (
    applicationId: number,
    status: string
  ) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/applications/${applicationId}/status`,
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

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            参加申請一覧
          </h1>

          <a
            href="/"
            className="rounded-lg bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            カレンダーへ戻る
          </a>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow">
            <p className="text-gray-500">
              現在、参加申請はありません。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const job = jobs.find(
                (job) => job.id === application.job_id
              );

              return (
                <div
                  key={application.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-5 shadow-sm"
                >
                  <div>
                    <p className="font-bold">
                      {job?.customer ?? "案件情報なし"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {job?.date} / {job?.work}
                    </p>

                    <p className="mt-2">
                      申請者：
                      <span className="font-semibold">
                        {application.user?.name ?? "不明"}
                      </span>

                      <span className="ml-2 text-gray-500">
                        ({application.user?.company ?? "会社不明"})
                      </span>
                    </p>

                    <p className="mt-1 text-sm">
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
    </main>
  );
}