// src/pages/HowToUse.js

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout.js';

const imageList = [
  '/images/how001.jpg',
  '/images/how002.jpg',
  '/images/how003.jpg',
  '/images/how004.jpg',
  '/images/how005.jpg',
  '/images/how006.jpg',
];

export default function HowToUse() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const isLastPage = page === imageList.length - 1;

  const handleNext = () => {
    if (!isLastPage) {
      setPage((prev) => prev + 1);
    } else {
      navigate('/select-date'); // ✅ 마지막 페이지에서 이동
    }
  };

  return (
    <Layout wide>
      <div className="flex flex-col items-center">
        {/* 진행 상태 표시 */}
        <p className="text-gray-600 mb-4">{`Step ${page + 1} of ${imageList.length}`}</p>

        {/* 중앙 이미지 */}
        <img
          src={imageList[page]}
          alt={`How to Use Step ${page + 1}`}
          className="max-w-full w-auto mb-8"
        />

        {/* 하단 버튼 */}
        <button
          onClick={handleNext}
          className="mt-6 px-6 py-2 bg-[#0B0C4E] text-white rounded-lg hover:bg-blue-900"
        >
          {isLastPage ? 'Done' : 'Next'}
        </button>
      </div>
    </Layout>
  );
}