// src/components/Map.js
import React, { useEffect } from 'react';

const Map = () => {
  useEffect(() => {
    const container = document.getElementById('map'); // 지도를 표시할 div
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);

    // 마커 추가 예시
    const marker = new window.kakao.maps.Marker({
      position: options.center,
    });
    marker.setMap(map);
  }, []);

  return (
    <div id="map" style={{ width: '100%', height: '500px' }}></div>
  );
};

export default Map;
