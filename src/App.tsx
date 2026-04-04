import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  LayoutGrid, 
  Type, 
  ChevronRight, 
  Home, 
  RefreshCcw, 
  Trophy,
  Star,
  ArrowLeft,
  FastForward,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { STAGE1_LEVELS, STAGE2_LEVELS, STAGE2B_LEVELS, STAGE3_LEVELS, Level } from './data';

type Stage = 'login' | 'home' | 'stage1' | 'stage2' | 'stage2b' | 'stage3';

const SOUNDS = {
  correct: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-reward-952.mp3',
  wrong: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
  win: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-button-click-471.mp3'
};

function TreasurePath({ current, total }: { current: number, total: number }) {
  const progress = (current / (total - 1)) * 100;
  
  return (
    <div className="w-full px-4 mb-8">
      <div className="relative h-4 bg-slate-100 rounded-full border-2 border-slate-200 shadow-inner">
        {/* The Path */}
        <div 
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-yellow-400 to-orange-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        />
        
        {/* Milestones */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {[...Array(total)].map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-500",
                i <= current ? "bg-white shadow-sm" : "bg-slate-300"
              )} 
            />
          ))}
        </div>

        {/* The Character */}
        <motion.div 
          initial={false}
          animate={{ right: `calc(${progress}% - 20px)` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          className="absolute -top-8 text-4xl z-10"
        >
          🏃
        </motion.div>

        {/* The Treasure */}
        <div className="absolute -top-10 -left-4 text-5xl animate-bounce">
          {current === total - 1 ? '🎁' : '💎'}
        </div>
        
        {/* Start Point */}
        <div className="absolute -top-8 -right-4 text-3xl">
          🚩
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 px-1">
        <span>البداية</span>
        <span>الكنز</span>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>('login');
  const [userName, setUserName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [userParts, setUserParts] = useState<string[]>([]);
  const [shuffledParts, setShuffledParts] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // Stage 2b specific state
  const [completedWords, setCompletedWords] = useState<string[]>([]);

  const levels = stage === 'stage1' ? STAGE1_LEVELS : 
                 stage === 'stage2' ? STAGE2_LEVELS : 
                 stage === 'stage2b' ? STAGE2B_LEVELS : STAGE3_LEVELS;
  const currentLevel = levels[currentLevelIdx];

  const playSfx = (url: string) => {
    if (isMuted) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  useEffect(() => {
    if (stage !== 'home' && currentLevel) {
      if (currentLevel.subType === 'multi') {
        // For multi-word formation (Stage 2b)
        // We show the first letter fixed, and shuffle the other options
        const allOptions = currentLevel.options?.flat() || [];
        setShuffledParts([...allOptions].sort(() => Math.random() - 0.5));
        setUserParts([currentLevel.parts[0]]);
        setCompletedWords([]);
      } else {
        setShuffledParts([...currentLevel.parts].sort(() => Math.random() - 0.5));
        setUserParts([]);
      }
      setIsCorrect(false);
      setShowSuccess(false);
      setShowSkip(false);
      setShowAnswer(false);
      setWrongAttempts(0);
    }
  }, [stage, currentLevelIdx]);

  const handlePartClick = (part: string, index: number) => {
    if (isCorrect) return;
    playSfx(SOUNDS.click);
    
    const newUserParts = [...userParts, part];
    setUserParts(newUserParts);
    
    // Remove from shuffled
    const newShuffled = [...shuffledParts];
    newShuffled.splice(index, 1);
    setShuffledParts(newShuffled);

    // Logic for Stage 2b (Multi-word formation)
    if (currentLevel.subType === 'multi') {
      // Check if the current sequence forms any of the target words
      // A word is formed when userParts length matches (fixed letter + option length)
      // For simplicity in 2b, each option is a pair or single part
      const currentWord = newUserParts.join('');
      const targetWords = currentLevel.options?.map(opt => currentLevel.parts[0] + opt.join('')) || [];
      
      const foundWordIdx = targetWords.findIndex(tw => tw === currentWord);
      
      if (foundWordIdx !== -1) {
        // Correct word formed!
        const word = targetWords[foundWordIdx];
        if (!completedWords.includes(word)) {
          const newCompleted = [...completedWords, word];
          setCompletedWords(newCompleted);
          
          // Reset for next word in the same level
          setUserParts([currentLevel.parts[0]]);
          
          // Check if all words in this level are found
          if (newCompleted.length === targetWords.length) {
            setIsCorrect(true);
            playSfx(currentLevelIdx === levels.length - 1 ? SOUNDS.win : SOUNDS.correct);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => setShowSuccess(true), 1000);
          }
        }
      } else {
        // If the length exceeds the longest possible word, it's wrong
        const maxLen = Math.max(...targetWords.map(tw => tw.length));
        if (currentWord.length >= maxLen) {
          handleWrong();
        }
      }
      return;
    }

    // Standard logic for other stages
    if (newUserParts.length === currentLevel.parts.length) {
      const result = newUserParts.join(stage === 'stage3' ? ' ' : '');
      const targetClean = currentLevel.target.replace(/\s/g, '').replace(/[ـًٌٍَُِّْ]/g, '');
      const resultClean = result.replace(/\s/g, '').replace(/[ـًٌٍَُِّْ]/g, '');
      
      if (resultClean === targetClean || result === currentLevel.target) {
        setIsCorrect(true);
        playSfx(currentLevelIdx === levels.length - 1 ? SOUNDS.win : SOUNDS.correct);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => setShowSuccess(true), 1000);
      } else {
        handleWrong();
      }
    }
  };

  const handleWrong = () => {
    playSfx(SOUNDS.wrong);
    setWrongAttempts(prev => prev + 1);
    if (wrongAttempts >= 1) {
      setShowSkip(true);
      setShowAnswer(true);
    }
    
    setTimeout(() => {
      if (currentLevel.subType === 'multi') {
        const allOptions = currentLevel.options?.flat() || [];
        setShuffledParts([...allOptions].sort(() => Math.random() - 0.5));
        setUserParts([currentLevel.parts[0]]);
        setCompletedWords([]);
      } else {
        setShuffledParts([...currentLevel.parts].sort(() => Math.random() - 0.5));
        setUserParts([]);
      }
    }, 1000);
  };

  const nextLevel = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
    } else {
      setStage('home');
      setCurrentLevelIdx(0);
    }
  };

  const skipLevel = () => {
    nextLevel();
  };

  const resetLevel = () => {
    if (currentLevel.subType === 'multi') {
      const allOptions = currentLevel.options?.flat() || [];
      setShuffledParts([...allOptions].sort(() => Math.random() - 0.5));
      setUserParts([currentLevel.parts[0]]);
      setCompletedWords([]);
    } else {
      setShuffledParts([...currentLevel.parts].sort(() => Math.random() - 0.5));
      setUserParts([]);
    }
    setIsCorrect(false);
    setWrongAttempts(0);
    setShowSkip(false);
    setShowAnswer(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length < 3) {
      setLoginError('يرجى إدخال اسم صحيح (3 أحرف على الأقل)');
      return;
    }
    if (loginCode !== '1234') { // Simple hardcoded code for demo
      setLoginError('الكود غير صحيح (جرب 1234)');
      return;
    }
    setStage('home');
    setLoginError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-sky-50">
      <AnimatePresence mode="wait">
        {stage === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border-8 border-blue-100 text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="w-24 h-24 bg-blue-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg rotate-3">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-black text-blue-600 arabic-text">تسجيل الدخول</h1>
              <p className="text-slate-500 font-bold">مرحباً بك في حروفي وكلماتي</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-right">
                <label className="block text-slate-700 font-bold mr-2">الاسم</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="أدخل اسمك هنا"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none text-xl font-bold text-center transition-all"
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="block text-slate-700 font-bold mr-2">الكود</label>
                <input
                  type="password"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="****"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none text-xl font-bold text-center transition-all"
                />
              </div>

              {loginError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 font-bold"
                >
                  {loginError}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl text-2xl font-black hover:bg-blue-700 transition-all shadow-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2"
              >
                دخول
              </button>
            </form>
          </motion.div>
        ) : stage === 'home' ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl w-full text-center space-y-12"
          >
            <div className="space-y-4">
              <motion.h1 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-6xl md:text-8xl font-black text-blue-600 drop-shadow-lg arabic-text"
              >
                حروفي وكلماتي
              </motion.h1>
              <p className="text-3xl text-orange-500 font-black arabic-text">تعلم مع دكتور فيشو</p>
              <p className="text-2xl text-slate-600 font-medium">مرحباً يا بطل، {userName}!</p>
              <p className="text-xl text-slate-500 font-medium">رحلة ممتعة في عالم اللغة العربية!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StageCard 
                title="المرحلة الأولى"
                desc="تركيب الحروف إلى كلمات"
                icon={<Type className="w-10 h-10" />}
                color="bg-orange-500"
                onClick={() => { setStage('stage1'); setCurrentLevelIdx(0); }}
              />
              <StageCard 
                title="المرحلة الثانية"
                desc="المقاطع الصوتية"
                icon={<LayoutGrid className="w-10 h-10" />}
                color="bg-green-500"
                onClick={() => { setStage('stage2'); setCurrentLevelIdx(0); }}
              />
              <StageCard 
                title="المرحلة الثانية (ب)"
                desc="ربط الحرف بالمقاطع"
                icon={<Layers className="w-10 h-10" />}
                color="bg-cyan-500"
                onClick={() => { setStage('stage2b'); setCurrentLevelIdx(0); }}
              />
              <StageCard 
                title="المرحلة الثالثة"
                desc="تركيب الجمل"
                icon={<BookOpen className="w-10 h-10" />}
                color="bg-purple-500"
                onClick={() => { setStage('stage3'); setCurrentLevelIdx(0); }}
              />
            </div>

            <button 
              onClick={() => setStage('login')}
              className="mt-8 text-slate-400 hover:text-slate-600 font-bold underline"
            >
              تسجيل الخروج
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 relative overflow-hidden border-8 border-blue-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
              <button 
                onClick={() => setStage('home')}
                className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all hover:scale-110"
              >
                <Home className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="px-6 py-3 bg-blue-100 text-blue-700 rounded-2xl font-black text-xl shadow-inner">
                  المستوى {currentLevelIdx + 1} من {levels.length}
                </div>
                <button 
                  onClick={resetLevel}
                  className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all hover:rotate-180"
                >
                  <RefreshCcw className="w-6 h-6 text-slate-600" />
                </button>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-slate-600" /> : <Volume2 className="w-6 h-6 text-slate-600" />}
                </button>
                {showSkip && (
                  <motion.button 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={skipLevel}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-100 text-orange-700 rounded-2xl font-black text-xl shadow-inner hover:bg-orange-200 transition-all"
                  >
                    تخطي
                    <FastForward className="w-6 h-6" />
                  </motion.button>
                )}
              </div>
            </div>
            
            {/* Treasure Path */}
            <TreasurePath current={currentLevelIdx} total={levels.length} />

            {/* Game Area */}
            <div className="flex flex-col items-center space-y-12 min-h-[450px]">
              {/* Target Visual */}
              <div className="text-center space-y-6">
                {currentLevel.image && (
                  <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-9xl mb-4 drop-shadow-xl"
                  >
                    {currentLevel.image}
                  </motion.div>
                )}
                {currentLevel.hint && (
                  <div className="bg-yellow-50 px-6 py-2 rounded-full border-2 border-yellow-100">
                    <p className="text-xl text-yellow-700 font-bold">تلميح: {currentLevel.hint}</p>
                  </div>
                )}
                {showAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 px-6 py-3 rounded-2xl border-2 border-blue-200"
                  >
                    <p className="text-lg text-blue-400 font-bold mb-1">الإجابة الصحيحة هي:</p>
                    <p className="text-3xl text-blue-600 font-black arabic-text">
                      {currentLevel.subType === 'multi' 
                        ? currentLevel.options?.map(opt => currentLevel.parts[0] + opt.join('')).join(' - ')
                        : currentLevel.target}
                    </p>
                  </motion.div>
                )}
                {currentLevel.subType === 'multi' && (
                  <div className="flex gap-2 justify-center">
                    {currentLevel.options?.map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-4 h-4 rounded-full",
                          i < completedWords.length ? "bg-green-500" : "bg-slate-200"
                        )} 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* User Selection Display */}
              <div className="flex flex-wrap justify-center gap-4 min-h-[100px] w-full border-b-8 border-dotted border-blue-50 pb-12">
                {userParts.map((part, i) => (
                  <motion.div
                    key={`user-${i}`}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={cn(
                      "px-8 py-5 rounded-3xl text-4xl font-black shadow-xl transition-all arabic-text border-b-8",
                      isCorrect 
                        ? "bg-green-500 text-white border-green-700" 
                        : "bg-blue-500 text-white border-blue-700"
                    )}
                  >
                    {part}
                  </motion.div>
                ))}
                {userParts.length === 0 && (
                  <div className="text-slate-200 text-3xl font-black self-center italic">
                    {stage === 'stage3' ? 'رتب الكلمات هنا...' : 'رتب الحروف هنا...'}
                  </div>
                )}
              </div>

              {/* Completed Words (Stage 2b) */}
              {currentLevel.subType === 'multi' && completedWords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {completedWords.map((word, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-xl border-2 border-green-200"
                    >
                      {word}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Available Parts */}
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                {shuffledParts.map((part, i) => (
                  <motion.button
                    key={`part-${i}`}
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePartClick(part, i)}
                    className="px-8 py-5 bg-white border-4 border-slate-100 rounded-3xl text-4xl font-black text-slate-700 shadow-lg hover:border-blue-400 hover:text-blue-600 transition-all arabic-text border-b-8 active:border-b-2 active:translate-y-1"
                  >
                    {part}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center p-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="bg-yellow-400 p-10 rounded-full mb-8 shadow-2xl border-8 border-white"
                  >
                    {currentLevelIdx === levels.length - 1 ? (
                      <div className="text-8xl">🎁</div>
                    ) : (
                      <Trophy className="w-24 h-24 text-white" />
                    )}
                  </motion.div>
                  <h2 className="text-6xl font-black text-slate-800 mb-4 arabic-text">
                    {currentLevelIdx === levels.length - 1 ? 'لقد وجدت الكنز!' : 'أحسنت يا بطل!'}
                  </h2>
                  <p className="text-2xl text-slate-600 mb-12 font-bold">
                    {currentLevelIdx === levels.length - 1 
                      ? 'مبروك! لقد أتممت جميع المستويات بنجاح' 
                      : 'لقد أنجزت المهمة بنجاح'}
                  </p>
                  <button 
                    onClick={nextLevel}
                    className="px-16 py-6 bg-blue-600 text-white rounded-3xl text-3xl font-black hover:bg-blue-700 transition-all shadow-xl hover:scale-105 flex items-center gap-4 border-b-8 border-blue-800"
                  >
                    {currentLevelIdx < levels.length - 1 ? 'المستوى التالي' : 'العودة للرئيسية'}
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decor */}
      <div className="fixed bottom-12 left-12 right-12 flex justify-between pointer-events-none opacity-30">
        <Star className="w-16 h-16 text-yellow-400 animate-pulse" />
        <Star className="w-12 h-12 text-blue-400 animate-bounce" />
        <Star className="w-14 h-14 text-green-400 animate-pulse" />
      </div>

      {/* Footer Credits */}
      <footer className="w-full max-w-4xl mt-12 mb-8 px-4 text-center border-t border-slate-200 pt-8 z-20">
        <p className="text-slate-400 font-bold arabic-text text-lg">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
        </p>
        <p className="text-blue-600 font-black arabic-text text-xl mt-2">
          تنفيذ: دكتور محمود الفيشاوي / اختصاصي النطق واللغة
        </p>
      </footer>
    </div>
  );
}

function StageCard({ title, desc, icon, color, onClick }: { 
  title: string, 
  desc: string, 
  icon: React.ReactNode, 
  color: string, 
  onClick: () => void 
}) {
  return (
    <motion.button
      whileHover={{ y: -15, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center p-10 bg-white rounded-[2.5rem] shadow-2xl border-b-[12px] border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden"
    >
      <div className={cn("p-6 rounded-3xl text-white mb-8 shadow-xl transition-transform group-hover:rotate-12", color)}>
        {icon}
      </div>
      <h3 className="text-3xl font-black text-slate-800 mb-3 arabic-text">{title}</h3>
      <p className="text-xl text-slate-500 font-bold leading-relaxed mb-4">{desc}</p>
      
      <div className="flex items-center gap-2 text-yellow-600 font-black">
        <Star className="w-5 h-5 fill-yellow-400" />
        <span>طريق الكنز</span>
      </div>
      
      {/* Decorative circle */}
      <div className={cn("absolute -bottom-12 -right-12 w-24 h-24 rounded-full opacity-10", color)} />
    </motion.button>
  );
}
