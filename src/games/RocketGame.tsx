import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, ArrowUp, CornerUpLeft, CornerUpRight, Star, Bot, Sparkles, Trash2, Delete, Home } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

type Position = { x: number; y: number; rotation: number };
type Command = 'FORWARD' | 'LEFT' | 'RIGHT';
type LevelData = { grid: number[][]; start: Position };

const LEVELS: LevelData[] = [
  {
    // Level 1: Just go straight
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [2, 0, 0, 0, 0],
    ],
    start: { x: 0, y: 0, rotation: 180 } // Facing down
  },
  {
    // Level 2: Turn once
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 2],
    ],
    start: { x: 0, y: 4, rotation: 90 } // Facing right
  },
  {
    // Level 3: Avoid wall
    grid: [
      [0, 0, 0, 0, 2],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    start: { x: 0, y: 4, rotation: 0 } // Facing up
  }
];

export default function RocketGame({ onBack }: { onBack: () => void }) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>(LEVELS[0]);
  const [playerState, setPlayerState] = useState<Position>(LEVELS[0].start);
  const [program, setProgram] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'crashed' | 'failed'>('idle');
  const [activeCmdIndex, setActiveCmdIndex] = useState(-1);
  const [stars, setStars] = useState(0);
  const [hint, setHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isRunningRef = useRef(false);

  const loadLevel = (index: number) => {
    const data = LEVELS[index];
    setLevelData(data);
    setPlayerState(data.start);
    setProgram([]);
    setGameState('idle');
    setActiveCmdIndex(-1);
    setHint("");
    setCurrentLevelIndex(index);
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const resetLevel = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    setPlayerState(levelData.start);
    setGameState('idle');
    setActiveCmdIndex(-1);
    setHint("");
  };

  const runProgram = async () => {
    if (program.length === 0) return;
    
    // Auto-reset before running
    let current = { ...levelData.start };
    setPlayerState(current);
    
    setIsRunning(true);
    isRunningRef.current = true;
    setGameState('running');
    setHint("");
    
    // wait a tiny bit for the reset animation to finish before starting
    await new Promise(r => setTimeout(r, 400));
    
    for (let i = 0; i < program.length; i++) {
        if (!isRunningRef.current) break;
        setActiveCmdIndex(i);
        const cmd = program[i];
        
        await new Promise(r => setTimeout(r, 200));
        if (!isRunningRef.current) break;
        
        if (cmd === 'FORWARD') {
            const dir = ((current.rotation / 90) % 4 + 4) % 4;
            const nextX = current.x + (dir === 1 ? 1 : dir === 3 ? -1 : 0);
            const nextY = current.y + (dir === 2 ? 1 : dir === 0 ? -1 : 0);
            
            if (nextX < 0 || nextX >= 5 || nextY < 0 || nextY >= 5 || levelData.grid[nextY][nextX] === 1) {
                setGameState('crashed');
                setIsRunning(false);
                isRunningRef.current = false;
                return;
            }
            current = { ...current, x: nextX, y: nextY };
        } else if (cmd === 'LEFT') {
            current = { ...current, rotation: current.rotation - 90 };
        } else if (cmd === 'RIGHT') {
            current = { ...current, rotation: current.rotation + 90 };
        }
        
        setPlayerState(current);
        
        await new Promise(r => setTimeout(r, 400));
        if (!isRunningRef.current) break;
        
        if (levelData.grid[current.y][current.x] === 2) {
            setGameState('won');
            setStars(s => s + 1);
            setIsRunning(false);
            isRunningRef.current = false;
            return;
        }
    }
    
    if (isRunningRef.current) {
        setGameState('failed');
        setIsRunning(false);
        isRunningRef.current = false;
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
    } else {
        generateAILevel();
    }
  };

  const generateAILevel = async () => {
    setIsGenerating(true);
    setHint("O Robô está criando um nível novo super legal! 🤖✨");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: `Crie um nível de quebra-cabeça 5x5 para um jogo de programação para crianças de 6 anos.
            0 = vazio, 1 = obstáculo (parede), 2 = estrela (objetivo).
            O jogador começa em uma posição vazia.
            Retorne APENAS um JSON válido com o seguinte formato:
            {
                "grid": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
                "start": {"x": 0, "y": 4, "rotation": 0}
            }
            Regras:
            - O grid DEVE ser exatamente 5x5.
            - Deve haver exatamente um número 2 (estrela) no grid.
            - O start.x e start.y devem apontar para um número 0.
            - Deve ser possível resolver o nível em 3 a 8 passos.
            - rotation deve ser 0 (cima), 90 (direita), 180 (baixo) ou 270 (esquerda).
            Não use markdown, apenas o JSON puro.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        grid: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.ARRAY,
                                items: { type: Type.NUMBER }
                            }
                        },
                        start: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                                rotation: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            }
        });
        
        let text = response.text?.trim() || "{}";
        if (text.startsWith('\`\`\`json')) text = text.slice(7);
        if (text.startsWith('\`\`\`')) text = text.slice(3);
        if (text.endsWith('\`\`\`')) text = text.slice(0, -3);
        
        const data = JSON.parse(text);
        
        if (data.grid && data.start) {
            setLevelData(data);
            setPlayerState(data.start);
            setProgram([]);
            setGameState('idle');
            setActiveCmdIndex(-1);
            setHint("Nível fresquinho criado para você! Divirta-se!");
            setCurrentLevelIndex(currentLevelIndex + 1);
        }
    } catch (e) {
        console.error(e);
        setHint("Ops, o Robô tropeçou. Tente de novo!");
    }
    setIsGenerating(false);
  };

  const getAIHint = async () => {
    setHint("Pensando... 🤖");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: `Você é um robô amigável ajudando uma criança de 6 anos a aprender a programar.
            A criança está tentando resolver um labirinto 5x5.
            O programa atual dela é: ${program.length > 0 ? program.join(', ') : 'vazio'}.
            Ela não conseguiu chegar no objetivo.
            Dê uma dica muito curta, encorajadora e simples em português do Brasil. Máximo de 2 frases curtas.
            Exemplo: "Ops! Parece que você esqueceu de virar. Tente adicionar um bloco azul!"`
        });
        setHint(response.text || "Continue tentando! Você consegue! 🚀");
    } catch (e) {
        console.error(e);
        setHint("Continue tentando! Você consegue! 🚀");
    }
  };

  const removeLastCommand = () => {
    if (program.length > 0) {
        setProgram(program.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-sans text-slate-800">
      <header className="bg-white p-3 sm:p-4 shadow-sm flex justify-between items-center rounded-b-3xl z-20 relative">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className="text-blue-500 hover:bg-blue-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors font-bold text-sm sm:text-base">
            Voltar
          </button>
          <h1 className="text-base sm:text-2xl font-black text-blue-600">
            Foguete Espacial
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-yellow-600 text-sm sm:text-base">
          <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" /> {stars}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full items-center lg:items-start justify-center mt-4">
        
        {/* Left Column: Game Board */}
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="relative w-full aspect-square bg-blue-100 p-3 rounded-3xl shadow-inner border-4 border-blue-200">
            <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1 sm:gap-2">
               {levelData.grid.map((row, y) => row.map((cell, x) => {
                  const isPlayerHere = playerState.x === x && playerState.y === y;
                  return (
                     <div key={`${x}-${y}`} className="relative bg-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-sm">
                        {cell === 1 && '🧱'}
                        {cell === 2 && !isPlayerHere && '🌟'}
                        {isPlayerHere && (
                           <motion.div
                              layoutId="player"
                              className="absolute inset-0 flex items-center justify-center z-10 text-4xl sm:text-5xl"
                              animate={{ rotate: playerState.rotation }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                           >
                              <div className="-rotate-45">🚀</div>
                           </motion.div>
                        )}
                     </div>
                  );
               }))}
            </div>
          </div>

          {hint && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-md border-2 border-blue-100 flex gap-4 items-start">
               <div className="bg-blue-100 p-2 rounded-full text-blue-500 shrink-0">
                  <Bot size={32} />
               </div>
               <p className="font-bold text-slate-600 flex-1">{hint}</p>
            </motion.div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="w-full max-w-md flex flex-col gap-6">
          
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100 min-h-[140px] flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
               <h2 className="font-bold text-slate-400 uppercase tracking-wider text-sm">Seu Código</h2>
               <div className="flex gap-2">
                 <button onClick={removeLastCommand} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-xl active:scale-95 transition-transform" disabled={isRunning || program.length === 0}>
                    <Delete size={20} />
                 </button>
                 <button onClick={() => setProgram([])} className="text-red-400 hover:text-red-500 p-2 bg-red-50 rounded-xl active:scale-95 transition-transform" disabled={isRunning || program.length === 0}>
                    <Trash2 size={20} />
                 </button>
               </div>
            </div>
            <div className="flex flex-wrap gap-2">
               {program.length === 0 && <span className="text-slate-300 font-medium">Adicione blocos abaixo...</span>}
               {program.map((cmd, i) => (
                  <motion.div layout key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${i === activeCmdIndex ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''} ${cmd === 'FORWARD' ? 'bg-emerald-500' : cmd === 'LEFT' ? 'bg-sky-500' : 'bg-indigo-500'}`}>
                     {cmd === 'FORWARD' ? <ArrowUp size={24} /> : cmd === 'LEFT' ? <CornerUpLeft size={24} /> : <CornerUpRight size={24} />}
                  </motion.div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button disabled={isRunning} onClick={() => setProgram([...program, 'LEFT'])} className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white p-4 rounded-3xl shadow-[0_8px_0_#0284c7] active:shadow-[0_0px_0_#0284c7] active:translate-y-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
               <CornerUpLeft size={32} />
               <span className="font-bold text-sm">Esquerda</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'FORWARD'])} className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white p-4 rounded-3xl shadow-[0_8px_0_#059669] active:shadow-[0_0px_0_#059669] active:translate-y-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowUp size={32} />
               <span className="font-bold text-sm">Andar</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'RIGHT'])} className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white p-4 rounded-3xl shadow-[0_8px_0_#4f46e5] active:shadow-[0_0px_0_#4f46e5] active:translate-y-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
               <CornerUpRight size={32} />
               <span className="font-bold text-sm">Direita</span>
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button onClick={resetLevel} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 p-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
               <RotateCcw size={24} /> Voltar
            </button>
            <button onClick={runProgram} disabled={isRunning || program.length === 0} className="flex-[2] bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-yellow-900 p-4 rounded-3xl font-black text-xl shadow-[0_8px_0_#ca8a04] active:shadow-[0_0px_0_#ca8a04] active:translate-y-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
               <Play size={28} fill="currentColor" /> VAI!
            </button>
          </div>

        </div>
      </main>

      {/* Modals */}
      {gameState === 'won' && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl mb-4 inline-block">
                  🌟
               </motion.div>
               <h2 className="text-3xl font-black text-emerald-500 mb-2">Você Conseguiu!</h2>
               <p className="text-slate-500 font-bold mb-8">O foguete chegou na estrela!</p>
               <button onClick={nextLevel} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-bold text-xl shadow-[0_6px_0_#059669] active:shadow-none active:translate-y-1 transition-all">
                  Próximo Nível
               </button>
            </motion.div>
         </div>
      )}

      {(gameState === 'crashed' || gameState === 'failed') && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <div className="text-6xl mb-4">{gameState === 'crashed' ? '💥' : '🤔'}</div>
               <h2 className="text-3xl font-black text-red-500 mb-2">{gameState === 'crashed' ? 'Bateu!' : 'Quase lá!'}</h2>
               <p className="text-slate-500 font-bold mb-8">
                  {gameState === 'crashed' ? 'Cuidado com os obstáculos!' : 'O foguete não chegou na estrela.'}
               </p>
               <div className="flex gap-4">
                  <button onClick={resetLevel} className="flex-1 bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all">
                     Tentar de Novo
                  </button>
                  <button onClick={() => { resetLevel(); getAIHint(); }} className="flex-1 bg-blue-500 text-white p-4 rounded-2xl font-bold shadow-[0_6px_0_#2563eb] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                     <Bot size={20} /> Dica
                  </button>
               </div>
            </motion.div>
         </div>
      )}

      {isGenerating && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-6xl mb-4 inline-block">
                  🤖
               </motion.div>
               <h2 className="text-2xl font-black text-blue-500 mb-2">Criando Nível...</h2>
               <p className="text-slate-500 font-bold">O Robô está preparando um desafio especial para você!</p>
            </div>
         </div>
      )}
    </div>
  );
}
