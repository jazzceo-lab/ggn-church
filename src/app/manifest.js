export default function manifest() {
  return {
    name: "길가는교회",
    short_name: "길가는교회",
    description: "길가는교회 교회 앱 - 주보, 일정, 게시판",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f2",
    theme_color: "#c19c89",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
