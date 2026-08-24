export const VAPID_PUBLIC_KEY =
  "BCI-5b61utQg1STpQbl_ol1Cva5HPiM9Y0OPVWuRht64IGX6CMs5R0VqA8bGizlfnXK2-8RKApZdRevxwuFCN3s";

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
