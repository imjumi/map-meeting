import Header from './header';

function Layout({ children, wide = false }) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-10 bg-gray-50">
        <Header />
        <div
          className={`
            w-full
            ${wide ? 'max-w-[95%] sm:max-w-[90%] md:max-w-5xl' : 'max-w-[95%] sm:max-w-[90%] md:max-w-xl'}
            bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8
          `}
        >
          {children}
        </div>
      </div>
    );
  }