// src/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import Header from './header';

const Map = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId');
  const userName = searchParams.get('name');
  const recommendMarkerRef = useRef(null);
  const [recommendAddress, setRecommendAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const recommendInfoWindowRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [categoryMarkers, setCategoryMarkers] = useState({});
  const [visibleCategories, setVisibleCategories] = useState({
    cafe: false,
    study: false,
    rental: false,
    meeting: false,
    parking: false,
  });
  const [showCategoryToggles, setShowCategoryToggles] = useState(false);
  const recommendCenterRef = useRef(null);
  const [categoryPlaces, setCategoryPlaces] = useState({});
  const [saved, setSaved] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const [showParticipantSelection, setShowParticipantSelection] = useState(false);

  const translations = {
    ko: {
      pageTitle: '최적의 모임장소를 찾아보세요!',
      searchPlaceholder: '장소 또는 주소 입력',
      searchButton: '검색',
      savedMessage: '✅ 출발지가 저장되었습니다!',
      selectParticipants: '참가자 선택',
      confirmLocationButton: '출발지 확정',
      viewRecommendationButton: '모임 추천 위치 보기',
      recommendPlaceButton: '모임장소 추천',
      recommendAddressLabel: '📍 추천 위치 주소:',
      copyButton: '복사',
      copiedMessage: '주소가 복사되었습니다!',
      nearbyStationNotFound: '근처 역을 찾을 수 없습니다.',
      selectStartLocation: '출발지 선택 후 확정해주세요.',
      noSearchResult: '검색 결과가 없습니다.',
      noSelectedParticipants: '선택된 참가자가 없습니다.',
      meetingRecommendationStation: '[모임추천 역]',
      categoryCafe: '카페',
      categoryStudy: '스터디카페',
      categoryRental: '공간대여',
      categoryMeeting: '회의실',
      categoryParking: '주차장',
      categoryListTitle: (category) => `${category} 추천 리스트`,
    },
    en: {
      pageTitle: 'Find the Best Meeting Location!',
      searchPlaceholder: 'Enter place or address',
      searchButton: 'Search',
      savedMessage: '✅ Start location saved!',
      selectParticipants: 'Select Participants',
      confirmLocationButton: 'Confirm Start Location',
      viewRecommendationButton: 'View Meeting Recommendation Location',
      recommendPlaceButton: 'Recommend Meeting Place',
      recommendAddressLabel: '📍 Recommended Location Address:',
      copyButton: 'Copy',
      copiedMessage: 'Address copied!',
      nearbyStationNotFound: 'Could not find nearby station.',
      selectStartLocation: 'Please select and confirm your start location.',
      noSearchResult: 'No search results.',
      noSelectedParticipants: 'No participants selected.',
      meetingRecommendationStation: '[Recommended Meeting Station]',
      categoryCafe: 'Cafe',
      categoryStudy: 'Study Cafe',
      categoryRental: 'Space Rental',
      categoryMeeting: 'Meeting Room',
      categoryParking: 'Parking Lot',
      categoryListTitle: (category) => `${category} Recommendation List`,
    },
  };

  const t = (key, ...args) => {
    const text = translations[currentLanguage][key];
    if (typeof text === 'function') {
      return text(...args);
    }
    return text || key;
  };

  const toggleLanguage = () => {
    setCurrentLanguage(prevLang => (prevLang === 'ko' ? 'en' : 'ko'));
  };

  const categoryConfigs = {
    cafe: { keyword: t('categoryCafe'), color: 'blue', icon: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png' },
    study: { keyword: t('categoryStudy'), color: 'green', icon: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png' },
    rental: { keyword: t('categoryRental'), color: 'orange', icon: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png' },
    meeting: { keyword: t('categoryMeeting'), color: 'purple', icon: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png' },
    parking: { keyword: t('categoryParking'), color: 'gray', icon: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png' },
  };

  const saveStartLocation = async (lat, lng) => {
    if (!userName || !meetingId) return;
    try {
      await setDoc(doc(db, `meetings/${meetingId}/participants/${userName}`), {
        name: userName,
        startLocation: { lat, lng },
        timestamp: new Date(),
      });
    } catch (e) {
      console.error('저장 실패:', e);
    }
  };

  const handleConfirmLocation = async () => {
    const marker = markerRef.current;
    if (!marker || !meetingId || !userName) return alert(t('selectStartLocation'));
    const position = marker.getPosition();
    await saveStartLocation(position.getLat(), position.getLng());

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addMarker = (latlng) => {
    const map = mapRef.current;
    if (markerRef.current) markerRef.current.setMap(null);
    const newMarker = new window.kakao.maps.Marker({ position: latlng });
    newMarker.setMap(map);
    markerRef.current = newMarker;
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0];
        const latlng = new window.kakao.maps.LatLng(place.y, place.x);
        addMarker(latlng);
        mapRef.current.setCenter(latlng);
      } else alert(t('noSearchResult'));
    });
  };

  const toggleCategory = (key) => {
    const updated = !visibleCategories[key];
    setVisibleCategories((prev) => ({ ...prev, [key]: updated }));
    const map = mapRef.current;

    if (categoryMarkers[key]) {
      categoryMarkers[key].forEach((m) => m.setMap(updated ? map : null));
      return;
    }

    if (recommendCenterRef.current) {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(
        categoryConfigs[key].keyword,
        (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            data.sort((a, b) => a.distance - b.distance);
            setCategoryPlaces((prev) => ({ ...prev, [key]: data }));
            const markers = data.map((place) => {
              const latlng = new window.kakao.maps.LatLng(place.y, place.x);
              const marker = new window.kakao.maps.Marker({
                position: latlng,
                title: place.place_name,
                image: new window.kakao.maps.MarkerImage(
                  categoryConfigs[key].icon,
                  new window.kakao.maps.Size(24, 35)
                )
              });
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div><a href="${place.place_url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;"><strong>[${categoryConfigs[key].keyword}]</strong> ${place.place_name}</a></div>`
              });

              marker.infowindow = infowindow; // 인포윈도우를 마커 객체에 연결

              window.kakao.maps.event.addListener(marker, 'click', () => {
                infowindow.open(map, marker);
                setTimeout(() => infowindow.close(), 2000);
              });
              window.kakao.maps.event.addListener(marker, 'mouseover', () => marker.setZIndex(999));
              window.kakao.maps.event.addListener(marker, 'mouseout', () => marker.setZIndex(1));
              if (updated) marker.setMap(map);
              return marker;
            });
            setCategoryMarkers((prev) => ({ ...prev, [key]: markers }));
          }
        },
        { location: recommendCenterRef.current, radius: 1000 }
      );
    }
  };

  const handleFetchParticipants = async () => {
    if (recommendInfoWindowRef.current) {
      recommendInfoWindowRef.current.close();
      recommendInfoWindowRef.current = null; // 참조 초기화
    }

    for (const key in categoryMarkers) {
      if (categoryMarkers[key]) {
        categoryMarkers[key].forEach(marker => {
          if (marker.infowindow) { // infowindow가 연결되어 있다면
            marker.infowindow.close();
          }
        });
      }
    }
    
    setShowParticipantSelection(true);

    try {
      const snapshot = await getDocs(collection(db, `meetings/${meetingId}/participants`));
      const fetched = snapshot.docs.map((doc) => doc.data());
      setParticipants(fetched);

      if (selectedParticipants.length === 0) {
        return alert(t('noSelectedParticipants'));
      }

      const filtered = fetched.filter((p) => selectedParticipants.includes(p.name));
      if (filtered.length === 0) return alert(t('noSelectedParticipants'));


      const avgLat = filtered.reduce((sum, loc) => sum + loc.startLocation.lat, 0) / filtered.length;
      const avgLng = filtered.reduce((sum, loc) => sum + loc.startLocation.lng, 0) / filtered.length;

      const center = new window.kakao.maps.LatLng(avgLat, avgLng);
      recommendCenterRef.current = center;

      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch('지하철역', (data, status) => {
        if (status !== window.kakao.maps.services.Status.OK) return alert(t('nearbyStationNotFound'));
        data.sort((a, b) => {
          const d1 = Math.pow(avgLat - parseFloat(a.y), 2) + Math.pow(avgLng - parseFloat(a.x), 2);
          const d2 = Math.pow(avgLat - parseFloat(b.y), 2) + Math.pow(avgLng - parseFloat(b.x), 2);
          return d1 - d2;
        });
        const nearest = data[0];
        const latlng = new window.kakao.maps.LatLng(nearest.y, nearest.x);

        mapRef.current.setCenter(latlng);

        if (recommendMarkerRef.current) recommendMarkerRef.current.setMap(null);
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
            setRecommendAddress(`${address} (${nearest.place_name})`);

            if (recommendInfoWindowRef.current) recommendInfoWindowRef.current.close();
            const iwContent = `
              <div style="
                position: relative;
                padding: 15px;
                font-size: 15px;
                white-space: nowrap;
                background-color: #fff;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: left;
                overflow: visible;
              ">
                <strong style="color: #2563eb; font-size: 17px; display: block; margin-bottom: 5px;">${t('meetingRecommendationStation')}</strong>
                <span style="display: block; margin-bottom: 3px;">🚇 <strong style="color: #4a5568;">${nearest.place_name}</strong></span>
                <span>📍 ${address}</span>
                <div style="
                  position: absolute;
                  bottom: -10px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 10px solid transparent;
                  border-right: 10px solid transparent;
                  border-top: 10px solid #e2e8f0;
                  z-index: 1;
                "></div>
                <div style="
                  position: absolute;
                  bottom: -9px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 9px solid transparent;
                  border-right: 9px solid transparent;
                  border-top: 9px solid #fff;
                  z-index: 2;
                "></div>
              </div>
            `;
            const infowindow = new window.kakao.maps.InfoWindow({
              content: iwContent,
              disableAutoPan: true,
              removable: true,
              pixelOffset: new window.kakao.maps.Point(0, -30)
            });
            infowindow.open(mapRef.current, marker);
            recommendInfoWindowRef.current = infowindow;
          }
        });
      }, { location: center, radius: 2000 });
    } catch (err) {
      console.error('출발지 불러오기 실패:', err);
    }
  };

  const handleToggleCategories = () => {
    setShowCategoryToggles(true);
    // 카테고리 토글 시 모든 카테고리 마커 닫기
    Object.keys(visibleCategories).forEach(key => {
      if (categoryMarkers[key]) {
        categoryMarkers[key].forEach(marker => marker.setMap(null));
      }
    });
    setVisibleCategories({ cafe: false, study: false, rental: false, meeting: false, parking: false });
  };

  const handleCopyAddress = () => {
    if (recommendAddress) {
      navigator.clipboard.writeText(recommendAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => console.error('복사 실패:', err));
    }
  };

  useEffect(() => {
    if (!meetingId) return;
    const container = document.getElementById('map');
    const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 3 };
    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;
    window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
      addMarker(mouseEvent.latLng);
    });
  }, [meetingId]);

  useEffect(() => {
    const fetchParticipantsList = async () => {
      if (!meetingId) return;
      try {
        const snapshot = await getDocs(collection(db, `meetings/${meetingId}/participants`));
        const fetched = snapshot.docs.map((doc) => doc.data());
        setParticipants(fetched);
      } catch (err) {
        console.error('참가자 목록 불러오기 실패:', err);
      }
    };
    fetchParticipantsList();
  }, [meetingId]);

  if (!meetingId) {
    return (
      <div className="relative min-h-screen bg-blue-50 flex flex-col items-center justify-center"> 
        <Header /> 
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center text-red-600 font-bold text-lg">
            ❗ URL에 <code>?meetingId=abc123&&name=johnDoe</code> 를 붙여주세요.
          </div>

          <button
            onClick={toggleLanguage}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded shadow-md transition duration-200"
          >
            {currentLanguage === 'ko' ? 'English Version' : '한국어 버전'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 min-h-screen relative">
      <Header /> 
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-8 mt-8"> 
        {t('pageTitle')}
      </h1>

      <div className="absolute top-24 right-4 z-10"> 
        <button
          onClick={toggleLanguage}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded shadow-md transition duration-200">
          {currentLanguage === 'ko' ? 'Eng' : '한'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-6 flex flex-col md:flex-row gap-6">

        <div id="map" style={{ flex: '2', height: '500px', minWidth: '300px' }}></div>

        <div className="flex flex-col gap-4 flex-1 p-2">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder={t('searchPlaceholder')}
              className="flex-1 border border-gray-300 p-3 rounded-lg w-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            <button
              onClick={handleSearch}
              className="bg-blue-700 hover:bg-blue-900 text-white px-6 py-3 rounded-lg text-lg shadow-md w-full sm:w-auto"
            >{t('searchButton')}</button>
          </div>

          {saved && (
            <p className="text-center text-green-600 font-semibold">{t('savedMessage')}</p>
          )}
          
          {showParticipantSelection && ( // <-- 여기가 시작
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <h2 className="font-bold mb-2 text-gray-800">{t('selectParticipants')}</h2>
            <div className="max-h-40 overflow-y-auto custom-scrollbar">
              {participants.map((p) => (
                <label key={p.name} className="flex items-center mb-1 text-gray-700">
                  <input
                    type="checkbox"
                    value={p.name}
                    checked={selectedParticipants.includes(p.name)}
                    onChange={(e) => {
                      setSelectedParticipants((prev) =>
                        e.target.checked ? [...prev, p.name] : prev.filter((n) => n !== p.name)
                      );
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmLocation}
              className="bg-blue-700 hover:bg-blue-900 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0.5 font-bold w-full"
            >{t('confirmLocationButton')}</button>

            <button
              onClick={handleFetchParticipants}
              className="bg-blue-700 hover:bg-blue-900 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0.5 font-bold w-full"
            >{t('viewRecommendationButton')}</button>

            <button
              onClick={handleToggleCategories}
              className="bg-blue-700 hover:bg-blue-900 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0.5 font-bold w-full"
            >{t('recommendPlaceButton')}</button>
          </div>
        

          {showCategoryToggles && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded shadow-sm">
              {Object.keys(categoryConfigs).map((key) => (
                <label key={key} className="flex items-center text-gray-700">
                  <input
                    type="checkbox"
                    checked={visibleCategories[key]}
                    onChange={() => toggleCategory(key)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  {t(`category${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                </label>
              ))}
            </div>
          )}
        </div> 
      </div> 

      {(recommendAddress || Object.values(categoryPlaces).some(arr => arr.length > 0 && Object.keys(visibleCategories).some(key => visibleCategories[key]))) && (
        <div className="max-w-6xl mx-auto mt-6 bg-white shadow-xl rounded-2xl p-6 flex flex-col gap-6"> 
          {recommendAddress && (
            <div className="text-gray-700 text-lg p-2 bg-gray-50 rounded shadow-sm w-full"> 
              <p className="mb-2">📍 추천 위치 주소: <span className="font-semibold">{recommendAddress}</span></p>
              <button
                onClick={handleCopyAddress}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded shadow-sm hover:shadow transition duration-200 font-bold"
              >복사</button>
              {copied && (
                <p className="text-green-600 text-sm mt-2">{t('copiedMessage')}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 w-full"> 
            {Object.keys(categoryPlaces).map((key) => (
              visibleCategories[key] && categoryPlaces[key]?.length > 0 && (
                <div key={key} className="p-2 bg-gray-50 rounded shadow-sm w-full"> 
                  <h3 className="font-bold mb-2 text-gray-800">
                    {t('categoryListTitle', categoryConfigs[key].keyword)}
                  </h3>
                  <ul className="text-sm text-gray-700 list-disc ml-4">
                    {categoryPlaces[key].map((place, index) => (
                      <li key={index}>
                        <a href={place.place_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {place.place_name} <span className="text-gray-500">({place.distance}m)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Map;