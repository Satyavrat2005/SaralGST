import React from 'react';
import { Star } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const Testimonials: React.FC = () => {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
            The Impact We Create <span className="text-brand-600">Together</span>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8 md:mb-12">
              
              {/* Left Placeholder Card */}
              <div className="hidden md:block w-full md:w-1/4 h-64 bg-brand-50 rounded-3xl opacity-50 transform scale-90"></div>

              {/* Main Testimonial Card */}
              <div className="w-full md:w-[500px] h-[350px] md:h-[400px] relative rounded-3xl overflow-hidden shadow-2xl group transition-transform hover:scale-[1.01]">
                  <img 
                      src="https://picsum.photos/id/107/800/800" 
                      alt="Niraj Singh" 
                      className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90 transition-all"
                  />
                  <div className="absolute top-6 left-6">
                      <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                          Change Management
                      </span>
                  </div>
                  <div className="absolute top-6 right-6">
                      <span className="text-white font-bold text-xl tracking-widest">SAP</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <p className="text-white text-xl md:text-2xl font-bold leading-tight mb-4">
                          "It's enterprise-ready and makes video creation easy."
                      </p>
                      <div className="flex flex-col">
                          <span className="text-white font-semibold">Niraj Singh</span>
                          <span className="text-white/70 text-sm">Head of SAP Experience Garage</span>
                      </div>
                  </div>
              </div>

              {/* Right Placeholder Card */}
              <div className="hidden md:block w-full md:w-1/4 h-64 bg-brand-50 rounded-3xl opacity-50 transform scale-90"></div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={400}>
          <div className="flex justify-center">
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl px-6 py-3 md:px-8 md:py-4 flex items-center gap-3">
                  <div className="flex -space-x-1">
                      {/* Small avatars if needed, or just empty for now as per screenshot primarily showing rating */}
                  </div>
                  <div className="text-base md:text-lg text-gray-800">
                      Rated <span className="font-bold text-brand-600">4.7/5</span> from 2000+ reviews
                  </div>
              </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default Testimonials;