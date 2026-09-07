/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.55.57"],
  async headers() {
    return [
      {
        // 서비스워커 파일은 절대 캐시되면 안 됨 - 캐시되면 새 배포를 브라우저가
        // 늦게 감지해서(최대 하루) 자동 업데이트가 느려짐.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
