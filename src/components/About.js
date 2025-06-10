// src/components/About.js

import { useNavigate } from 'react-router-dom';
import Layout from './Layout.js';

export default function About() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">About Us</h2>
        <p className="text-gray-600 max-w-xl mb-6">
          OurMeetingGuide is a web-based scheduling platform 
          that helps users coordinate group meetings with ease. <br />
Participants can select the dates and time slots they are available, <br />
and the platform visually compares everyone's availability 
to intuitively determine the optimal meeting time. <br />
Additionally, users can receive suggestions for meeting locations 
based on their entered starting points, <br />
along with nearby venues around the recommended location.
        </p>
        <img
          src="/images/about-img.png"
          alt="About"
          className="max-w-sm mb-10"
        />

        {/* ✅ How to Use 버튼 */}
        <button
          onClick={() => navigate('/how-to-use')}
          className="mt-4 px-6 py-2 bg-[#0B0C4E] text-white rounded-lg hover:bg-blue-900"
        >
          How to Use
        </button>
      </div>
    </Layout>
  );
}