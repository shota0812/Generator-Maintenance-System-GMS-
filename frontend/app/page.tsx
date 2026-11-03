type Job = {
  date: string;
  customer: string;
  work: string;
  technician: string;
  contractor: string;
  status: string;
};

const jobs: Job[] = [
  {
    date: "2026-07-01",
    customer: "Amazon千葉",
    work: "月例点検",
    technician: "田中",
    contractor: "山田電機",
    status: "予定",
  },
  {
    date: "2026-07-01",
    customer: "SCSK東京",
    work: "負荷試験",
    technician: "佐藤",
    contractor: "ABC設備",
    status: "完了",
  },
  {
    date: "2026-07-02",
    customer: "Amazon大阪",
    work: "月例点検",
    technician: "鈴木",
    contractor: "山田電機",
    status: "予定",
  },
];

const groupedJobs = jobs.reduce((acc, job) => {
  if (!acc[job.date]) {
    acc[job.date] = [];
  }

  acc[job.date].push(job);

  return acc;
}, {} as Record<string, Job[]>);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="mx-auto max-w-7xl">

        <h1 className="mb-8 text-4xl font-bold">
          発電機保守管理システム
        </h1>

        <div className="mb-8 flex justify-between">

          <input
            type="text"
            placeholder="顧客・担当者・外注で検索..."
            className="w-96 rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
          />

          <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
            ＋ 案件追加
          </button>

        </div>

        <div className="space-y-10">

          {Object.entries(groupedJobs).map(([date, dayJobs]) => (

            <section key={date}>

              <h2 className="mb-4 text-2xl font-bold">
                📅 {date}
              </h2>

              <table className="w-full overflow-hidden rounded-lg bg-white shadow">

                <thead className="bg-gray-200">

                  <tr>

                    <th className="p-4 text-left">顧客</th>
                    <th className="p-4 text-left">作業内容</th>
                    <th className="p-4 text-left">担当者</th>
                    <th className="p-4 text-left">外注</th>
                    <th className="p-4 text-left">状態</th>

                  </tr>

                </thead>

                <tbody>

                  {dayJobs.map((job, index) => (

                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4">{job.customer}</td>
                      <td className="p-4">{job.work}</td>
                      <td className="p-4">{job.technician}</td>
                      <td className="p-4">{job.contractor}</td>
                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium
                          ${
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

                    </tr>

                  ))}

                </tbody>

              </table>

            </section>

          ))}

        </div>

      </div>

    </main>
  );
}