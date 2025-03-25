// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

const Map = () => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId');

  // 🔹 출발지 저장
  const saveStartLocation = async (lat, lng) => {
    try {
      const docRef = await addDoc(
        collection(db, `meetings/${meetingId}/participants`),
        {
          name: '홍길동',
          startLocation: { lat, lng },
          timestamp: new Date(),
        }
      );
      console.log('Firestore에 저장됨:', docRef.id);
    } catch (e) {
      console.error('저장 실패:', e);
    }
  };

  // 🔹 출발지 불러오기
  const handleFetchParticipants = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, `meetings/${meetingId}/participants`)
      );
      const locations = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          name: data.name,
          lat: data.startLocation.lat,
          lng: data.startLocation.lng,
        });
      });

      console.log('참가자 출발지 목록:', locations);
      alert(`총 ${locations.length}명의 출발지를 불러왔습니다!`);
    } catch (err) {
      console.error('출발지 불러오기 실패:', err);
    }
  };

  // 🔹 지도 초기화 및 클릭 이벤트
  useEffect(() => {
    if (!meetingId) return; // ⛔ 훅은 항상 상단! 조건은 안쪽에서 분기

    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;

    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      addMarker(latlng);
      saveStartLocation(latlng.getLat(), latlng.getLng());
    });
  }, [meetingId]);

  // 🔹 마커 추가
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

  // 🔹 장소 검색
  const handleSearch = () => {
    if (!searchKeyword.trim()) return;

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, function (data, status) {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0];
        const latlng = new window.kakao.maps.LatLng(place.y, place.x);
        addMarker(latlng);
        saveStartLocation(place.y, place.x);
        mapRef.current.setCenter(latlng);
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  // 🔹 마커 초기화
  const clearMarkers = () => {
    markers.forEach((m) => m.marker.setMap(null));
    setMarkers([]);
  };

  // 🔹 meetingId 없을 때 안내 메시지 (useEffect 전에 return❌)
  if (!meetingId) {
    return (
      <div className="text-center text-red-600 mt-10">
        ❗ URL에 <code>?meetingId=abc123</code> 를 붙여주세요.
      </div>
    );
  }

  // 🔹 JSX UI
  return (
    <div className="bg-gray-100 min-h-screen py-10">
      {/* 상단 타이틀 */}
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
        Our Meeting Guide
      </h1>
  
      {/* 검색창 + 버튼 카드 영역 */}
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* 검색창 + 검색 버튼 */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="장소 또는 주소 입력"
            className="flex-1 border border-gray-300 p-3 rounded-lg w-full text-lg"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg whitespace-nowrap"
          >
            검색
          </button>
        </div>
  
        {/* 지도 표시 영역 (기존 유지) */}
        <div id="map" style={{ width: '100%', height: '500px' }}></div>
  
        {/* 하단 안내 및 버튼들 */}
        <p className="mt-4 text-center text-gray-600 text-sm">
          현재 출발지 수: {markers.length}
        </p>
  
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <button
            onClick={handleFetchParticipants}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            모임 추천 위치 보기
          </button>
          <button
            onClick={clearMarkers}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg text-lg"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
  
};

export default Map;
