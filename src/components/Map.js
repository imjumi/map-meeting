// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

const Map = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId');
  const userName = searchParams.get('name');

  // 🔹 출발지 저장
  const saveStartLocation = async (lat, lng) => {
    if (!userName || !meetingId) return;
    try {
      await setDoc(doc(db, `meetings/${meetingId}/participants/${userName}`), {
        name: userName,
        startLocation: { lat, lng },
        timestamp: new Date(),
      });
      console.log('✅ 출발지 저장됨!');
    } catch (e) {
      console.error('저장 실패:', e);
    }
  };

  // 🔹 참가자 출발지 불러오기
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

  // 🔹 지도 초기화 및 마커 클릭 이벤트
  useEffect(() => {
    if (!meetingId) return;
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 3,
    };
    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;

    const handleClick = (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      addMarker(latlng);
    };

    window.kakao.maps.event.addListener(map, 'click', handleClick);

    return () => {
      window.kakao.maps.event.removeListener(map, 'click', handleClick);
    };
  }, [meetingId]);

  // 🔹 마커 추가 (이전 마커 제거)
  const addMarker = (latlng) => {
    const map = mapRef.current;
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    const newMarker = new window.kakao.maps.Marker({ position: latlng });
    newMarker.setMap(map);
    markerRef.current = newMarker;
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;
  
    const ps = new window.kakao.maps.services.Places();
  
    ps.keywordSearch(searchKeyword, function (data, status) {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0];
        const latlng = new window.kakao.maps.LatLng(place.y, place.x);
        addMarker(latlng);
        mapRef.current.setCenter(latlng);
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };
  

  // 🔹 출발지 확정 버튼 클릭
  const handleConfirmLocation = () => {
    const marker = markerRef.current;
    if (!marker || !meetingId || !userName) {
      alert('출발지 선택 후 확정해주세요.');
      return;
    }
    const position = marker.getPosition();
    saveStartLocation(position.getLat(), position.getLng());
  };

  // 🔹 마커 수동 초기화 (현재는 안 쓰이지만 참고용)
  const clearMarkers = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  // meetingId 없을 경우 안내
  if (!meetingId) {
    return (
      <div className="text-center text-red-600 mt-10">
        ❗ URL에 <code>?meetingId=abc123</code> 를 붙여주세요.
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
        Our Meeting Guide
      </h1>

      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* 검색 */}
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

        {/* 지도 */}
        <div id="map" style={{ width: '100%', height: '500px' }}></div>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <button
            onClick={handleFetchParticipants}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            모임 추천 위치 보기
          </button>
          <button
            onClick={handleConfirmLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            출발지 확정
          </button>
        </div>
      </div>
    </div>
  );
};

export default Map;
