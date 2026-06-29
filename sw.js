// 思い出しカード — service worker
// キャッシュ名を変えると古いキャッシュが破棄され、更新が反映されます。
const CACHE = "omoidashi-v1";

// オフラインで開くために最低限キャッシュするファイル
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

// インストール時にアプリ本体をキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 古いキャッシュの掃除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 取得: キャッシュ優先、無ければネット。ネット取得分は次回用に保存。
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 同一オリジンの正常レスポンスのみキャッシュ
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // ナビゲーション要求がオフラインで失敗したらアプリ本体を返す
          if (req.mode === "navigate") return caches.match("./index.html");
        });
    })
  );
});
