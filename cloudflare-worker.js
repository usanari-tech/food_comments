import openNextWorker from "./.open-next/worker.js";

export default {
    // 1. 通常のHTTPリクエスト (Next.js アプリのルーティング) はそのままOpenNextのfetchハンドラーへ流す
    async fetch(request, env, ctx) {
        return openNextWorker.fetch(request, env, ctx);
    },

    // 2. CloudflareのCron (scheduledイベント) を受け取る専用のハンドラー
    async scheduled(event, env, ctx) {
        // 自分自身のデプロイ先URL (本番URL) などを構成して叩くか、
        // あるいはOpenNextのfetchをダミーリクエストで無理やり呼び出すことも可能。
        // 最も確実なのは fetch() で自分のAPIルートへリクエストを飛ばす方法。

        const req = new Request("http://localhost/api/cron/daily-report", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.CRON_SECRET}`,
            },
        });

        console.log(`Cron triggered: Executing OpenNext handler internally`);

        try {
            const resp = await openNextWorker.fetch(req, env, ctx);
            const text = await resp.text();
            console.log(`Cron execution result: ${resp.status}`, text);
        } catch (error) {
            console.error("Cron fetch error:", error);
        }
    }
};
