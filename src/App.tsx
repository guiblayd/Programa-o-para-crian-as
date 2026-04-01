import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Rocket, Paintbrush, ChefHat, Map } from 'lucide-react';
import RocketGame from './games/RocketGame';
import PainterGame from './games/PainterGame';
import ChefGame from './games/ChefGame';
import PirateGame from './games/PirateGame';

type Screen = 'home' | 'rocket' | 'painter' | 'chef' | 'pirate';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  if (currentScreen === 'rocket') {
    return <RocketGame onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'painter') {
    return <PainterGame onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'chef') {
    return <ChefGame onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'pirate') {
    return <PirateGame onBack={() => setCurrentScreen('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-sans text-slate-800 items-center justify-center p-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-black text-blue-600 flex items-center justify-center gap-4 mb-4">
          <Sparkles className="text-yellow-400 w-12 h-12" /> 
          Código Kids
          <Sparkles className="text-yellow-400 w-12 h-12" />
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-bold">
          Escolha sua aventura de programação!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Rocket Game Card */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentScreen('rocket')}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-blue-100 flex flex-col items-center text-center gap-6 group hover:border-blue-400 transition-colors"
        >
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Rocket className="w-16 h-16 text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-blue-600 mb-2">Foguete Espacial</h2>
            <p className="text-slate-500 font-bold text-lg">
              Aprenda a dar direções e desviar de obstáculos!
            </p>
          </div>
          <div className="mt-auto bg-blue-500 text-white px-8 py-3 rounded-full font-bold text-xl shadow-[0_6px_0_#2563eb] group-active:shadow-none group-active:translate-y-1 transition-all">
            Jogar
          </div>
        </motion.button>

        {/* Painter Game Card */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentScreen('painter')}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-purple-100 flex flex-col items-center text-center gap-6 group hover:border-purple-400 transition-colors"
        >
          <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <Paintbrush className="w-16 h-16 text-purple-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-purple-600 mb-2">Robô Pintor</h2>
            <p className="text-slate-500 font-bold text-lg">
              Crie sequências de ações para pintar quadros!
            </p>
          </div>
          <div className="mt-auto bg-purple-500 text-white px-8 py-3 rounded-full font-bold text-xl shadow-[0_6px_0_#7e22ce] group-active:shadow-none group-active:translate-y-1 transition-all">
            Jogar
          </div>
        </motion.button>

        {/* Chef Game Card */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentScreen('chef')}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-orange-100 flex flex-col items-center text-center gap-6 group hover:border-orange-400 transition-colors"
        >
          <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
            <ChefHat className="w-16 h-16 text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-orange-600 mb-2">Mestre Cuca</h2>
            <p className="text-slate-500 font-bold text-lg">
              Pegue os ingredientes e leve ao forno!
            </p>
          </div>
          <div className="mt-auto bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-xl shadow-[0_6px_0_#ea580c] group-active:shadow-none group-active:translate-y-1 transition-all">
            Jogar
          </div>
        </motion.button>

        {/* Pirate Game Card */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentScreen('pirate')}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-amber-100 flex flex-col items-center text-center gap-6 group hover:border-amber-400 transition-colors"
        >
          <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <Map className="w-16 h-16 text-amber-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-amber-600 mb-2">Caça ao Tesouro</h2>
            <p className="text-slate-500 font-bold text-lg">
              Pegue a chave e abra o baú do pirata!
            </p>
          </div>
          <div className="mt-auto bg-amber-500 text-white px-8 py-3 rounded-full font-bold text-xl shadow-[0_6px_0_#d97706] group-active:shadow-none group-active:translate-y-1 transition-all">
            Jogar
          </div>
        </motion.button>
      </div>
    </div>
  );
}
