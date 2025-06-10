// src/components/Header.js

import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white shadow-md mb-6">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        {/* 로고/제목 */}
        <h1
          onClick={() => navigate('/')}
          className="text-lg sm:text-xl font-bold text-blue-700 cursor-pointer text-center sm:text-left"
        >
          OMG_OurMeetingGuide
        </h1>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
          <button
            onClick={() => navigate('/about')}
            className="px-4 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
          >
            About Us
          </button>
          <button
            onClick={() => navigate('/how-to-use')}
            className="px-4 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
          >
            How to Use
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
          >
            Home
          </button>
        </div>
      </div>
    </header>
  );
}