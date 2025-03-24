// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';

const Map = () => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 3,
    };
    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;

    // 지도 클릭 시 마커 추가
    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      addMarker(latlng);
    });
  }, []);

  const addMarker = (latlng) => {
    const map = mapRef.current;
    const marker = new window.kakao.maps.Marker({ position: latlng });
    marker.setMap(map);

    const newMarker = {
      lat: latlng.getLat(),
      lng: latlng.getLng(),
      marker: marker,
    };
    setMarkers((prev) => [...prev, newMarker]);
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, function (data, status) {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0]; // 첫 번째 결과만 사용
        const latlng = new window.kakao.maps.LatLng(place.y, place.x);
        addMarker(latlng);
        mapRef.current.setCenter(latlng);
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  const clearMarkers = () => {
    markers.forEach((m) => m.marker.setMap(null));
    setMarkers([]);
  };

  return (
    <div>
      <div className="max-w-xl mx-auto mb-4">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="장소 또는 주소 입력"
          className="border p-2 w-full my-2 rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            검색
          </button>
          <button
            onClick={clearMarkers}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            초기화
          </button>
        </div>
      </div>

      <div id="map" style={{ width: '100%', height: '500px' }}></div>
      <p className="mt-2 text-sm text-gray-500">
        현재 출발지 수: {markers.length}
      </p>
    </div>
  );
};

export default Map;
