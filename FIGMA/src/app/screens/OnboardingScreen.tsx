"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicShell } from '../components/PublicShell';
import { Clock, Shield, Award, ChevronRight } from 'lucide-react';

const slides = [
  {
    icon: Clock,
    title: 'Track Your Screen Time',
    description: 'Monitor your digital habits with intelligent insights and real-time tracking.',
    gradient: 'from-[#FF9F1C] to-[#FF6B1C]',
  },
  {
    icon: Shield,
    title: 'Block Distractions',
    description: 'Stay focused by blocking apps and websites that steal your attention.',
    gradient: 'from-[#10D980] to-[#06B55E]',
  },
  {
    icon: Award,
    title: 'Earn Rewards & Streaks',
    description: 'Build powerful habits with gamification, XP points, and achievement badges.',
    gradient: 'from-[#8B5CF6] to-[#7C3AED]',
  },
];

export function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <PublicShell narrow>
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden px-2 py-8 sm:px-6">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-6 text-sm text-gray-400 transition-colors hover:text-white sm:right-6"
        >
          Skip
        </button>

        {/* Slides */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <motion.div
                className={`w-32 h-32 rounded-[32px] bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center mb-8 shadow-2xl`}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return <Icon className="w-16 h-16 text-white" strokeWidth={2} />;
                })()}
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-4 px-4">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p className="text-gray-400 text-base leading-relaxed px-6">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-[#FF9F1C]'
                  : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] text-[#0B0B0F] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#FF9F1C]/30 hover:shadow-xl hover:shadow-[#FF9F1C]/40 transition-all active:scale-95"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </PublicShell>
  );
}
