"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { YOUTH } from "@/lib/youth";

// 청년부 회원은 앱을 열거나 로그인했을 때 첫 화면을 청년부 메뉴로 보낸다.
// 한 번(세션당)만 보내서, 이후 메뉴의 "소개"를 누르면 홈에 그대로 머물 수 있다.
export const YOUTH_LANDED_KEY = "youthLanded";

export default function YouthLanding() {
  const { user, district } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || district !== YOUTH) return;
    try {
      if (sessionStorage.getItem(YOUTH_LANDED_KEY)) return;
      sessionStorage.setItem(YOUTH_LANDED_KEY, "1");
    } catch {}
    router.replace("/youth");
  }, [user, district, router]);

  return null;
}
