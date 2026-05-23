import PageMeta from "../../components/common/PageMeta";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const confettiRef = useRef<HTMLDivElement | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // navigation logic: allow homepage to display always
  // users can freely choose their role and sign up

  const spawnConfetti = (count = 18) => {
    const container = confettiRef.current || document.body;
    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.src = "/images/logo/maker.logo.png";
      img.className = "confetti-piece";
      const size = Math.floor(Math.random() * 28) + 18; // 18-46px
      img.style.width = `${size}px`;
      img.style.left = `${Math.random() * 100}vw`;
      img.style.top = `-10vh`;
      img.style.pointerEvents = "none";
      img.style.position = "fixed";
      img.style.zIndex = "60";
      img.style.opacity = "0.95";
      const duration = (Math.random() * 1.8 + 1.6).toFixed(2); // 1.6-3.4s
      img.style.animation = `confettiFall ${duration}s linear forwards`;
      img.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;

      img.addEventListener("animationend", () => img.remove());
      container.appendChild(img);
    }
  };

  const handleRoleClick = (role: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    spawnConfetti(20);
    // send user to signup with role parameter
    const target = `/signup?role=${role}`;
    console.log("navigating to", target);
    setTimeout(() => navigate(target), 300);
  };

  return (
    <>
      <PageMeta title="Homepage" description="Landing page with video background" />

     <div className="relative h-screen w-full overflow-hidden group">
  
  {/* Background Image */}
  <img
    src="/images/back (2).png"
    alt="Background"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* Sliding Overlay */}
  <div className="absolute inset-0 -translate-y-full 
                bg-black/60 backdrop-blur-sm
                transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:translate-y-0
                flex flex-col items-center justify-center z-20">

    {/* Logo */}
    <div className="absolute top-6 left-6">
      <img
        src="/images/logo/makerdark.png"
        alt="Logo"
        className="h-14 sm:h-16 w-auto"
      />
    </div>

    {/* Center Content */}
    <div className="text-center max-w-lg px-4 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Welcome to our platform
        </h1>
        <p className="mt-2 text-white/90">Select your role</p>
      </div>

     <div className="flex flex-col sm:flex-row gap-6 justify-center">
  <button
    onClick={() => {
      if (isNavigating) return;
      setIsNavigating(true);
      spawnConfetti(20);
      setTimeout(() => navigate("/signin"), 300);
    }}
    className="rounded-full border-2 border-white px-10 py-4 text-lg font-semibold 
               text-white transition-all duration-300
               hover:bg-white hover:text-gray-900 hover:-translate-y-1"
  >
    Advertiser
  </button>

  <button
    onClick={() => handleRoleClick("operator")}
    className="rounded-full border-2 border-white px-10 py-4 text-lg font-semibold 
               text-white transition-all duration-300
               hover:bg-white hover:text-gray-900 hover:-translate-y-1"
  >
    Operator
  </button>
</div>
    </div>
  </div>
</div>
    </>
  );
}
