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
          className="text-lg sm:text-xl font-bold cursor-pointer text-center sm:text-left"
        >
          <span className="text-blue-800">O</span>
          <span className="text-blue-800">M</span>
          <span className="text-blue-800">G</span>
          <span className="text-blue-500">:</span>
          <span className="text-blue-800"> O</span>
          <span className="text-blue-500">ur</span>
          <span className="text-blue-800">M</span>
          <span className="text-blue-500">eeting</span>
          <span className="text-blue-800">G</span>
          <span className="text-blue-500">uide</span>
        </h1>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
          <button
            onClick={() => navigate('/about')}
            className="hover:bg-blue-900 px-4 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sm"
          >
            About Us
          </button>
          <button
            onClick={() => navigate('/how-to-use')}
            className="hover:bg-blue-900 px-4 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sm"
          >
            How to Use
          </button>
        </div>
      </div>
    </header>
  );
}