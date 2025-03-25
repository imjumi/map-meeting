import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

const Map = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId');
  const userName = searchParams.get('name');
  const recommendMarkerRef = useRef(null);
  const [recommendAddress, setRecommendAddress] = useState('');


  
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

  const handleConfirmLocation = () => {
    const marker = markerRef.current;
    if (!marker || !meetingId || !userName) {
      alert('출발지 선택 후 확정해주세요.');
      return;
    }
    const position = marker.getPosition();
    saveStartLocation(position.getLat(), position.getLng());
  };

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

  // 🔹 참가자 출발지 불러오고 최적 위치 추천
  const handleFetchParticipants = async () => {
    try {
      const snapshot = await getDocs(collection(db, `meetings/${meetingId}/participants`));
      const locations = [];
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          name: data.name,
          lat: data.startLocation.lat,
          lng: data.startLocation.lng,
        });
      });
  
      if (locations.length === 0) {
        alert('출발지가 없습니다.');
        return;
      }
  
      const avgLat = locations.reduce((sum, l) => sum + l.lat, 0) / locations.length;
      const avgLng = locations.reduce((sum, l) => sum + l.lng, 0) / locations.length;
  
      const center = new window.kakao.maps.LatLng(avgLat, avgLng);
      const map = mapRef.current;
  

      // 🔴 이전 추천 마커 제거
    if (recommendMarkerRef.current) {
      recommendMarkerRef.current.setMap(null);
    }

    // 🔴 새 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: center,
      map,
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
        new window.kakao.maps.Size(64, 69),
        { offset: new window.kakao.maps.Point(27, 69) }
      ),
    });

    recommendMarkerRef.current = marker; // 🧠 최신 마커 기억

    map.setCenter(center);


      // 주소 + 이름 표시
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(avgLng, avgLat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name;
        const names = locations.map((l) => l.name).join(', ');
        const content = `
        <div style="
          padding: 12px 16px;
          background: white;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          box-shadow: 0px 2px 6px rgba(0,0,0,0.3);
          white-space: pre-line;
        ">
          <strong>📍 추천 위치</strong><br/>
          ${address}<br/>
          👥 ${names}
        </div>
      `;
        const infoWindow = new window.kakao.maps.InfoWindow({ content });
        setRecommendAddress(address); // 🧠 추천 주소 기억

        window.kakao.maps.event.addListener(marker, 'mouseover', () => infoWindow.open(map, marker));
        window.kakao.maps.event.addListener(marker, 'mouseout', () => infoWindow.close());
      }
    });
  } catch (err) {
    console.error('출발지 불러오기 실패:', err);
  }
};


const handleCopyAddress = () => {
  if (recommendAddress) {
    navigator.clipboard.writeText(recommendAddress)
      .then(() => alert('주소가 복사되었습니다!'))
      .catch((err) => console.error('복사 실패:', err));
  }
};


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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            검색
          </button>
        </div>

        <div id="map" style={{ width: '100%', height: '500px' }}></div>

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
        {recommendAddress && (
  <div className="text-center text-gray-700 text-lg mt-6">
    📍 추천 위치 주소: <span className="font-semibold">{recommendAddress}</span>
    <button
      onClick={handleCopyAddress}
      className="ml-2 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
    >
      복사
    </button>
  </div>
)}

      </div>
    </div>
  );
};

export default Map;
