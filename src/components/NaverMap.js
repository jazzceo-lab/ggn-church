"use client";

import Script from "next/script";
import { useRef } from "react";

const NAVER_MAPS_CLIENT_ID = "yelryd0rww";
// 경기도 부천시 원미구 중동로248번길 52 (OpenStreetMap 기준 좌표)
const CENTER = { lat: 37.5013429, lng: 126.7723596 };

export default function NaverMap() {
  const mapElRef = useRef(null);
  const initedRef = useRef(false);

  function initMap() {
    if (initedRef.current || !mapElRef.current || !window.naver) return;
    initedRef.current = true;

    const center = new window.naver.maps.LatLng(CENTER.lat, CENTER.lng);
    const map = new window.naver.maps.Map(mapElRef.current, {
      center,
      zoom: 16,
    });

    new window.naver.maps.Marker({ position: center, map });
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAPS_CLIENT_ID}`}
        onReady={initMap}
      />
      <div ref={mapElRef} className="h-[280px] w-full rounded-lg" />
    </>
  );
}
