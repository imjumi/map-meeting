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
  const recommendInfoWindowRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [categoryMarkers, setCategoryMarkers] = useState({});
  const [visibleCategories, setVisibleCategories] = useState({
    cafe: true,
    study: true,
    rental: true,
    meeting: true,
  });
  const [showCategoryToggles, setShowCategoryToggles] = useState(false);

  const handleToggleCategories = () => {
    setShowCategoryToggles((prev) => !prev);
  };
  

  const categoryConfigs = {
    cafe: { keyword: '카페', color: 'blue' },
    study: { keyword: '스터디카페', color: 'green' },
    rental: { keyword: '공간대여', color: 'orange' },
    meeting: { keyword: '회의실', color: 'purple' },
  };

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

  const showCategoryPlaces = (lat, lng) => {
    const ps = new window.kakao.maps.services.Places();
    const map = mapRef.current;
    const center = new window.kakao.maps.LatLng(lat, lng);
    const newMarkers = {};

    Object.entries(categoryConfigs).forEach(([key, { keyword, color }]) => {
      ps.keywordSearch(
        keyword,
        (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            newMarkers[key] = data.map((place) => {
              const latlng = new window.kakao.maps.LatLng(place.y, place.x);
              const marker = new window.kakao.maps.Marker({
                position: latlng,
                title: place.place_name,
              });
              if (visibleCategories[key]) marker.setMap(map);
              return marker;
            });
            setCategoryMarkers((prev) => ({ ...prev, ...newMarkers }));
          }
        },
        { location: center, radius: 2000 }
      );
    });
  };

  const toggleCategory = (key) => {
    setVisibleCategories((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      const map = mapRef.current;
      if (categoryMarkers[key]) {
        categoryMarkers[key].forEach((m) => m.setMap(updated[key] ? map : null));
      }
      return updated;
    });
  };

  const handleFetchParticipants = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, `meetings/${meetingId}/participants`)
      );
      const fetched = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          name: data.name,
          lat: data.startLocation.lat,
          lng: data.startLocation.lng,
        });
      });

      setParticipants(fetched);

      // 🔹 모든 참가자 자동 선택 (최초만)
      if (selectedParticipants.length === 0) {
        setSelectedParticipants(fetched.map((p) => p.name));
        return;
      }

      const filtered = fetched.filter((p) =>
        selectedParticipants.includes(p.name)
      );

      if (filtered.length === 0) {
        alert('선택된 참가자가 없습니다.');
        return;
      }

      const avgLat =
        filtered.reduce((sum, loc) => sum + loc.lat, 0) / filtered.length;
      const avgLng =
        filtered.reduce((sum, loc) => sum + loc.lng, 0) / filtered.length;

      const center = new window.kakao.maps.LatLng(avgLat, avgLng);
      mapRef.current.setCenter(center);

      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(
        '지하철역',
        (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            data.sort((a, b) => {
              const d1 =
                Math.pow(avgLat - parseFloat(a.y), 2) +
                Math.pow(avgLng - parseFloat(a.x), 2);
              const d2 =
                Math.pow(avgLat - parseFloat(b.y), 2) +
                Math.pow(avgLng - parseFloat(b.x), 2);
              return d1 - d2;
            });

            const nearest = data[0];
            const latlng = new window.kakao.maps.LatLng(nearest.y, nearest.x);

            if (recommendMarkerRef.current) {
              recommendMarkerRef.current.setMap(null);
            }

            const marker = new window.kakao.maps.Marker({
              position: latlng,
              image: new window.kakao.maps.MarkerImage(
                'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                new window.kakao.maps.Size(40, 40)
              ),
            });
            marker.setMap(mapRef.current);
            recommendMarkerRef.current = marker;

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(nearest.x, nearest.y, (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const address = result[0].address.address_name;
                const text = `${address} (${nearest.place_name})`;
                setRecommendAddress(text);

                if (recommendInfoWindowRef.current) {
                  recommendInfoWindowRef.current.close();
                }

                const iwContent = `
                  <div style="padding:10px; font-size:16px; white-space:nowrap;">
                    <strong>[모임추천 역]</strong> <br/>
                    🚇 ${nearest.place_name}<br/>
                    📍 ${address}
                  </div>
                `;
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: iwContent,
                });
                infowindow.open(mapRef.current, marker);
                recommendInfoWindowRef.current = infowindow;
              }
            });
          } else {
            alert('근처 역을 찾을 수 없습니다.');
          }
        },
        {
          location: center,
          radius: 2000,
        }
      );
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

        <div className="bg-white p-4 rounded shadow-md mb-4">
          <h2 className="font-bold mb-2">참가자 선택</h2>
          {participants.map((p) => (
            <label key={p.name} className="flex items-center mb-1">
              <input
                type="checkbox"
                value={p.name}
                checked={selectedParticipants.includes(p.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedParticipants((prev) => [...prev, p.name]);
                  } else {
                    setSelectedParticipants((prev) =>
                      prev.filter((name) => name !== p.name)
                    );
                  }
                }}
                className="mr-2"
              />
              {p.name}
            </label>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
          <button
            onClick={handleConfirmLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            출발지 확정
          </button>

          <button
  onClick={handleFetchParticipants}
  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg"
>
  모임 추천 위치 보기
</button>


          <button
            onClick={handleToggleCategories}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            모임장소 추천
          </button>
        </div>

        {showCategoryToggles && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> 카페
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> 스터디카페
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> 공간대여
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> 회의실
            </label>
          </div>
        )}

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
