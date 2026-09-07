// 새 배포가 나오면 이 파일(sw.js) 내용이 바뀌어서 브라우저가 새 서비스워커를 감지한다.
// 예전에는 새 서비스워커가 설치돼도 기존 탭을 다 닫기 전까진 "대기" 상태로 남아있어서,
// 홈 화면에 설치해둔 회원들이 새 버전을 받으려면 캐시를 수동으로 지워야 했다.
// skipWaiting/clients.claim으로 새 버전이 설치되자마자 바로 활성화되게 한다
// (자동 새로고침은 PwaUpdater 컴포넌트가 담당).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "길가는교회", {
      body: data.body || "",
      icon: "/images/logo-mark.jpg",
      badge: "/images/logo-mark.jpg",
      data: { url: data.url || "/messages" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/messages";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
