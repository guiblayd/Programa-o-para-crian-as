import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Paintbrush, Star, Bot, Sparkles, Trash2, Delete, Home } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

type Position = { x: number; y: number };
type Command = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'PAINT';
type LevelData = { size: number; start: Position; targets: Position[] };

const LEVELS: LevelData[] = [
  {
    size: 3,
    start: { x: 0, y: 0 },
    targets: [{ x: 2, y: 0 }]
  },
  {
    size: 3,
    start: { x: 0, y: 0 },
    targets: [{ x: 1, y: 0 }, { x: 1, y: 1 }]
  },
  {
    size: 4,
    start: { x: 0, y: 0 },
    targets: [{ x: 1, y: 1 }, { x: 2, y: 2 }]
  }
];

export default function PainterGame({ onBack }: { onBack: () => void }) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>(LEVELS[0]);
  const [playerState, setPlayerState] = useState<Position>(LEVELS[0].start);
  const [painted, setPainted] = useState<Position[]>([]);
  const [program, setProgram] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'failed'>('idle');
  const [activeCmdIndex, setActiveCmdIndex] = useState(-1);
  const [stars, setStars] = useState(0);
  const [hint, setHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isRunningRef = useRef(false);

  const loadLevel = (index: number) => {
    const data = LEVELS[index];
    setLevelData(data);
    setPlayerState(data.start);
    setPainted([]);
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
    setPainted([]);
    setGameState('idle');
    setActiveCmdIndex(-1);
    setHint("");
  };

  const runProgram = async () => {
    if (program.length === 0) return;
    
    // Auto-reset before running
    let current = { ...levelData.start };
    let currentPainted: Position[] = [];
    setPlayerState(current);
    setPainted([]);
    
    setIsRunning(true);
    isRunningRef.current = true;
    setGameState('running');
    setHint("");
    
    await new Promise(r => setTimeout(r, 400));
    
    for (let i = 0; i < program.length; i++) {
        if (!isRunningRef.current) break;
        setActiveCmdIndex(i);
        const cmd = program[i];
        
        await new Promise(r => setTimeout(r, 200));
        if (!isRunningRef.current) break;
        
        if (cmd === 'UP') current.y = Math.max(0, current.y - 1);
        if (cmd === 'DOWN') current.y = Math.min(levelData.size - 1, current.y + 1);
        if (cmd === 'LEFT') current.x = Math.max(0, current.x - 1);
        if (cmd === 'RIGHT') current.x = Math.min(levelData.size - 1, current.x + 1);
        
        if (cmd === 'PAINT') {
            if (!currentPainted.some(p => p.x === current.x && p.y === current.y)) {
                currentPainted = [...currentPainted, { ...current }];
                setPainted(currentPainted);
            }
        }
        
        setPlayerState({ ...current });
        
        await new Promise(r => setTimeout(r, 400));
        if (!isRunningRef.current) break;
    }
    
    if (isRunningRef.current) {
        // Check win condition
        const allTargetsPainted = levelData.targets.every(t => 
            currentPainted.some(p => p.x === t.x && p.y === t.y)
        );
        const noExtraPainted = currentPainted.length === levelData.targets.length;
        
        if (allTargetsPainted && noExtraPainted) {
            setGameState('won');
            setStars(s => s + 1);
        } else {
            setGameState('failed');
        }
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
    setHint("O Robô está criando um quadro novo! 🤖✨");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: `Crie um nível para um jogo de programação de pintar quadros para crianças de 6 anos.
            Retorne APENAS um JSON válido com o seguinte formato:
            {
                "size": 4,
                "start": {"x": 0, "y": 0},
                "targets": [{"x": 1, "y": 1}, {"x": 2, "y": 2}]
            }
            Regras:
            - size deve ser 3, 4 ou 5.
            - start deve ser {x: 0, y: 0}.
            - targets deve ter entre 2 e 4 posições.
            - As posições em targets devem estar dentro do grid (0 a size-1).
            Não use markdown, apenas o JSON puro.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        size: { type: Type.NUMBER },
                        start: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
                            }
                        },
                        targets: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    x: { type: Type.NUMBER },
                                    y: { type: Type.NUMBER }
                                }
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
        
        if (data.size && data.start && data.targets) {
            setLevelData(data);
            setPlayerState(data.start);
            setPainted([]);
            setProgram([]);
            setGameState('idle');
            setActiveCmdIndex(-1);
            setHint("Quadro novo pronto para ser pintado!");
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
            A criança está tentando pintar os quadrados corretos em um grid.
            O programa atual dela é: ${program.length > 0 ? program.join(', ') : 'vazio'}.
            Ela não conseguiu pintar os alvos corretos.
            Dê uma dica muito curta, encorajadora e simples em português do Brasil. Máximo de 2 frases curtas.
            Exemplo: "Ops! Parece que você esqueceu de usar o pincel. Tente adicionar o bloco de pintar!"`
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
    <div className="min-h-screen bg-[#faf5ff] flex flex-col font-sans text-slate-800">
      <header className="bg-white p-3 sm:p-4 shadow-sm flex justify-between items-center rounded-b-3xl z-20 relative">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className="text-purple-500 hover:bg-purple-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors font-bold text-sm sm:text-base">
            Voltar
          </button>
          <h1 className="text-base sm:text-2xl font-black text-purple-600">
            Robô Pintor
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-yellow-600 text-sm sm:text-base">
          <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" /> {stars}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full items-center lg:items-start justify-center mt-4">
        
        {/* Left Column: Game Board */}
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="relative w-full aspect-square bg-purple-100 p-3 rounded-3xl shadow-inner border-4 border-purple-200">
            <div className="w-full h-full grid gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${levelData.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${levelData.size}, minmax(0, 1fr))` }}>
               {Array.from({length: levelData.size}).map((_, y) => 
                  Array.from({length: levelData.size}).map((_, x) => {
                     const isPlayerHere = playerState.x === x && playerState.y === y;
                     const isTarget = levelData.targets.some(t => t.x === x && t.y === y);
                     const isPainted = painted.some(p => p.x === x && p.y === y);
                     
                     let cellClasses = "relative rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-sm border-4 transition-colors ";
                     if (isPainted) {
                         cellClasses += "bg-purple-400 border-purple-500";
                     } else if (isTarget) {
                         cellClasses += "bg-white border-dashed border-purple-300";
                     } else {
                         cellClasses += "bg-white/60 border-transparent";
                     }

                     return (
                        <div key={`${x}-${y}`} className={cellClasses}>
                           {isPlayerHere && (
                              <motion.div
                                 layoutId="painter"
                                 className="absolute inset-0 flex items-center justify-center z-10 text-4xl sm:text-5xl"
                                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              >
                                 🤖
                              </motion.div>
                           )}
                        </div>
                     );
                  })
               )}
            </div>
          </div>

          {hint && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-md border-2 border-purple-100 flex gap-4 items-start">
               <div className="bg-purple-100 p-2 rounded-full text-purple-500 shrink-0">
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
                  <motion.div layout key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${i === activeCmdIndex ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''} ${cmd === 'PAINT' ? 'bg-pink-500' : 'bg-purple-500'}`}>
                     {cmd === 'UP' && <ArrowUp size={24} />}
                     {cmd === 'DOWN' && <ArrowDown size={24} />}
                     {cmd === 'LEFT' && <ArrowLeft size={24} />}
                     {cmd === 'RIGHT' && <ArrowRight size={24} />}
                     {cmd === 'PAINT' && <Paintbrush size={24} />}
                  </motion.div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button disabled={isRunning} onClick={() => setProgram([...program, 'UP'])} className="bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#7e22ce] active:shadow-[0_0px_0_#7e22ce] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowUp size={28} />
               <span className="font-bold text-xs">Cima</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'DOWN'])} className="bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#7e22ce] active:shadow-[0_0px_0_#7e22ce] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowDown size={28} />
               <span className="font-bold text-xs">Baixo</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'PAINT'])} className="bg-pink-500 hover:bg-pink-400 active:bg-pink-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#be185d] active:shadow-[0_0px_0_#be185d] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <Paintbrush size={28} />
               <span className="font-bold text-xs">Pintar</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'LEFT'])} className="bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#7e22ce] active:shadow-[0_0px_0_#7e22ce] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowLeft size={28} />
               <span className="font-bold text-xs">Esq.</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'RIGHT'])} className="bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#7e22ce] active:shadow-[0_0px_0_#7e22ce] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowRight size={28} />
               <span className="font-bold text-xs">Dir.</span>
            </button>
            <div className="flex items-center justify-center">
                {/* Empty space for grid alignment */}
            </div>
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
                  🎨
               </motion.div>
               <h2 className="text-3xl font-black text-emerald-500 mb-2">Obra de Arte!</h2>
               <p className="text-slate-500 font-bold mb-8">Você pintou os lugares certos!</p>
               <button onClick={nextLevel} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-bold text-xl shadow-[0_6px_0_#059669] active:shadow-none active:translate-y-1 transition-all">
                  Próximo Nível
               </button>
            </motion.div>
         </div>
      )}

      {gameState === 'failed' && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <div className="text-6xl mb-4">🤔</div>
               <h2 className="text-3xl font-black text-red-500 mb-2">Quase lá!</h2>
               <p className="text-slate-500 font-bold mb-8">
                  Você não pintou todos os alvos ou pintou lugares errados.
               </p>
               <div className="flex gap-4">
                  <button onClick={resetLevel} className="flex-1 bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all">
                     Tentar de Novo
                  </button>
                  <button onClick={() => { resetLevel(); getAIHint(); }} className="flex-1 bg-purple-500 text-white p-4 rounded-2xl font-bold shadow-[0_6px_0_#7e22ce] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
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
               <h2 className="text-2xl font-black text-purple-500 mb-2">Criando Quadro...</h2>
               <p className="text-slate-500 font-bold">O Robô está preparando uma nova tela para você!</p>
            </div>
         </div>
      )}
    </div>
  );
}
