import React from "react";
// GridShape removed: replaced with background video per design request
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
          <div className="items-center hidden w-full h-full lg:w-1/2 lg:grid">
          <div className="relative flex items-start justify-center z-1 w-full h-full">
            {/* Background video (fills the panel) */}
              <video
                className="absolute right-0 top-0 bottom-0 h-full object-contain"
                src="/video/homevideo.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="relative flex flex-col items-start pt-6 pl-3 max-w-xs z-10 text-white">
                <Link to="/" className="block mb-4">
                  <img
                    className="-ml-12"
                    width={280}
                    height={64}
                    src="/images/logo/makerlight.png"
                    alt="Logo"
                  />
                </Link>
              </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-1 right-6.5 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
