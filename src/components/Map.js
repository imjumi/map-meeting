// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// firebase에 로케이션 저장
const saveStartLocation = async (lat, lng) => {
    try {
      const docRef = await addDoc(collection(db, 'meetings/testMeeting/participants'), {
        name: '홍길동', // 일단 테스트용 이름
        startLocation: { lat, lng },
        timestamp: new Date(),
      });
      console.log('Firestore에 저장됨:', docRef.id);
    } catch (e) {
      console.error('저장 실패:', e);
    }
  };
  
  // firebase에서 로케이션 불러오기
  const handleFetchParticipants = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'meetings/testMeeting/participants'));
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

  // 지도 표시
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
  
    // 지도 클릭 시 마커 추가 + 저장
    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      addMarker(latlng);
      saveStartLocation(latlng.getLat(), latlng.getLng()); // ✅ 이 줄은 괜찮음
    });
  }, []); // ✅ useEffect 끝
  

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
        saveStartLocation(place.y, place.x);
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
          <button
            onClick={handleFetchParticipants}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            >
            모임추천위치보기
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
