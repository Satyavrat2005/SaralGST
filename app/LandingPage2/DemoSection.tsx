import React, { useState, useRef, useEffect } from 'react';
import { Scale, Utensils, Home, Wrench, User } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const DemoSection: React.FC = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<'deep' | 'morvi'>('deep');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const businessTypes = [
    { icon: Scale, label: 'Legal' },
    { icon: Utensils, label: 'Restaurant' },
    { icon: Home, label: 'Real Estate' },
    { icon: Wrench, label: 'Service' },
  ];

  const videoSources = {
    deep: '/demo-deep.mp4',
    morvi: '/demo-morvi.mp4'
  };

  // Handle voice change - smoothly transition videos
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  }, [selectedVoice]);

  const handlePlayDemo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <RevealOnScroll>
        <div className="max-w-7xl mx-auto demo-purple-bg rounded-[2.5rem] p-6 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-20 text-white overflow-hidden relative shadow-2xl">
          
          {/* Content Left */}
          <div className="flex-1 z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              See how the AskJohnny <br/> actually <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Sounds</span>
            </h2>
            <p className="text-gray-200/80 mb-8 md:mb-12 max-w-md leading-relaxed text-base md:text-lg">
              Your 24/7 AI-receptionist that answers, books and delights while you focus on growing your business
            </p>

            <div className="space-y-6 md:space-y-8">
              <div>
                <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">1. Select Business</h3>
                <div className="flex gap-2 md:gap-3">
                  {businessTypes.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBusiness(idx)}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        selectedBusiness === idx 
                          ? 'bg-white text-[#362951] shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <item.icon size={20} className="md:w-6 md:h-6" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">2. Select Voice</h3>
                <div className="inline-flex bg-white/10 p-1 rounded-xl">
                  <button 
                    onClick={() => setSelectedVoice('deep')}
                    className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                      selectedVoice === 'deep' ? 'bg-white text-[#362951] shadow-md' : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="font-medium">Deep</span>
                  </button>
                  <button 
                    onClick={() => setSelectedVoice('morvi')}
                    className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                      selectedVoice === 'morvi' ? 'bg-white text-[#362951] shadow-md' : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="font-medium">Morvi</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handlePlayDemo}
                  className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-medium transition-all flex items-center justify-center gap-2 group text-sm md:text-base"
                >
                  <span>{isPlaying ? 'Pause Demo' : 'See Demo'}</span>
                  <svg 
                    className={`w-4 h-4 fill-current group-hover:scale-110 transition-transform ${isPlaying ? '' : ''}`}
                    viewBox="0 0 24 24"
                  >
                    {isPlaying ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Right - Video Player */}
          <div className="flex-1 relative min-h-[300px] md:min-h-[400px]">
            <div className="absolute inset-0 bg-[#4a3865] rounded-[2rem] border-4 border-white/10 shadow-2xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                onEnded={handleVideoEnd}
                poster=""
              >
                <source src={videoSources[selectedVoice]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Play overlay when not playing */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:bg-black/40"
                  onClick={handlePlayDemo}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110">
                    <svg className="w-6 h-6 md:w-8 md:h-8 ml-1 fill-white text-white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};

export default DemoSection;