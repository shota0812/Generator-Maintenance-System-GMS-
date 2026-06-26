export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-4xl font-bold mb-8">
        発電機保守管理システム
      </h1>

      <div className="flex justify-between mb-8">

        <input
          type="text"
          placeholder="検索..."
          className="w-80 rounded-lg border border-gray-300 p-3"
        />

        <button className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          ＋ 案件追加
        </button>

      </div>

      <div className="space-y-10">

        <section>

          <h2 className="mb-4 text-2xl font-bold">
            📅 2026/07/01（水）
          </h2>

          <table className="w-full border bg-white shadow">

            <thead className="bg-gray-200">

              <tr>

                <th className="p-3 text-left">顧客</th>
                <th className="p-3 text-left">作業内容</th>
                <th className="p-3 text-left">担当者</th>
                <th className="p-3 text-left">外注</th>
                <th className="p-3 text-left">状態</th>

              </tr>

            </thead>

            <tbody>

              <tr className="border-t">

                <td className="p-3">Amazon千葉</td>
                <td className="p-3">月例点検</td>
                <td className="p-3">田中</td>
                <td className="p-3">山田電機</td>
                <td className="p-3">予定</td>

              </tr>

              <tr className="border-t">

                <td className="p-3">SCSK東京</td>
                <td className="p-3">負荷試験</td>
                <td className="p-3">佐藤</td>
                <td className="p-3">ABC設備</td>
                <td className="p-3">完了</td>

              </tr>

            </tbody>

          </table>

        </section>

        <section>

          <h2 className="mb-4 text-2xl font-bold">
            📅 2026/07/02（木）
          </h2>

          <table className="w-full border bg-white shadow">

            <thead className="bg-gray-200">

              <tr>

                <th className="p-3 text-left">顧客</th>
                <th className="p-3 text-left">作業内容</th>
                <th className="p-3 text-left">担当者</th>
                <th className="p-3 text-left">外注</th>
                <th className="p-3 text-left">状態</th>

              </tr>

            </thead>

            <tbody>

              <tr className="border-t">

                <td className="p-3">Amazon大阪</td>
                <td className="p-3">月例点検</td>
                <td className="p-3">鈴木</td>
                <td className="p-3">山田電機</td>
                <td className="p-3">予定</td>

              </tr>

            </tbody>

          </table>

        </section>

      </div>

    </main>
  );
}
