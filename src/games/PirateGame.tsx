import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Bot, Sparkles, Trash2, Delete, Map, Key, Unlock } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

type Position = { x: number; y: number };
type Command = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OPEN';

type LevelData = {
  size: number;
  grid: number[][]; // 0: sand, 1: water (obstacle)
  start: Position;
  keyPos: Position;
  chestPos: Position;
};

const LEVELS: LevelData[] = [
  {
    // Level 1: Simple path to key then chest
    size: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    start: { x: 0, y: 4 },
    keyPos: { x: 2, y: 4 },
    chestPos: { x: 4, y: 4 }
  },
  {
    // Level 2: Avoid water
    size: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 1, 0],
    ],
    start: { x: 0, y: 4 },
    keyPos: { x: 2, y: 2 },
    chestPos: { x: 4, y: 0 }
  },
  {
    // Level 3: Maze
    size: 5,
    grid: [
      [0, 0, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ],
    start: { x: 0, y: 0 },
    keyPos: { x: 0, y: 4 },
    chestPos: { x: 4, y: 4 }
  }
];

export default function PirateGame({ onBack }: { onBack: () => void }) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>(LEVELS[0]);
  const [playerState, setPlayerState] = useState<Position>(LEVELS[0].start);
  const [hasKey, setHasKey] = useState(false);
  
  const [program, setProgram] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'crashed' | 'failed' | 'missing_key'>('idle');
  const [activeCmdIndex, setActiveCmdIndex] = useState(-1);
  const [stars, setStars] = useState(0);
  const [hint, setHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isRunningRef = useRef(false);

  const loadLevel = (index: number) => {
    const data = LEVELS[index];
    setLevelData(data);
    setPlayerState(data.start);
    setHasKey(false);
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
    setHasKey(false);
    setGameState('idle');
    setActiveCmdIndex(-1);
    setHint("");
  };

  const runProgram = async () => {
    if (program.length === 0) return;
    
    let current = { ...levelData.start };
    let currentHasKey = false;
    
    setPlayerState(current);
    setHasKey(currentHasKey);
    
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
        
        if (cmd === 'UP' || cmd === 'DOWN' || cmd === 'LEFT' || cmd === 'RIGHT') {
            const nextX = current.x + (cmd === 'RIGHT' ? 1 : cmd === 'LEFT' ? -1 : 0);
            const nextY = current.y + (cmd === 'DOWN' ? 1 : cmd === 'UP' ? -1 : 0);
            
            if (nextX < 0 || nextX >= levelData.size || nextY < 0 || nextY >= levelData.size || levelData.grid[nextY][nextX] === 1) {
                setGameState('crashed');
                setIsRunning(false);
                isRunningRef.current = false;
                return;
            }
            current = { x: nextX, y: nextY };
            setPlayerState(current);
            
            // Auto-pickup key when walking over it
            if (current.x === levelData.keyPos.x && current.y === levelData.keyPos.y && !currentHasKey) {
                currentHasKey = true;
                setHasKey(true);
            }
            
        } else if (cmd === 'OPEN') {
            if (current.x === levelData.chestPos.x && current.y === levelData.chestPos.y) {
                if (currentHasKey) {
                    setGameState('won');
                    setStars(s => s + 1);
                    setIsRunning(false);
                    isRunningRef.current = false;
                    return;
                } else {
                    setGameState('missing_key');
                    setIsRunning(false);
                    isRunningRef.current = false;
                    return;
                }
            }
        }
        
        await new Promise(r => setTimeout(r, 400));
        if (!isRunningRef.current) break;
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
    setHint("O Pirata está desenhando um novo mapa do tesouro! 🗺️✨");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: `Crie um nível de quebra-cabeça 5x5 para um jogo de programação para crianças de 6 anos.
            O jogador (Pirata) deve pegar a chave e depois abrir o baú do tesouro.
            Retorne APENAS um JSON válido com o seguinte formato:
            {
                "size": 5,
                "grid": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
                "start": {"x": 0, "y": 4},
                "keyPos": {"x": 2, "y": 2},
                "chestPos": {"x": 4, "y": 0}
            }
            Regras:
            - grid: 0 = areia (caminho livre), 1 = água (obstáculo).
            - start, keyPos e chestPos devem estar em posições com valor 0.
            - Não sobreponha start, keyPos e chestPos.
            - Deve ser possível resolver o nível em 5 a 12 passos.
            Não use markdown, apenas o JSON puro.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        size: { type: Type.NUMBER },
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
                                y: { type: Type.NUMBER }
                            }
                        },
                        keyPos: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
                            }
                        },
                        chestPos: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
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
        
        if (data.grid && data.start && data.keyPos && data.chestPos) {
            setLevelData(data);
            setPlayerState(data.start);
            setHasKey(false);
            setProgram([]);
            setGameState('idle');
            setActiveCmdIndex(-1);
            setHint("Novo mapa pronto! Vamos à caça!");
            setCurrentLevelIndex(currentLevelIndex + 1);
        }
    } catch (e) {
        console.error(e);
        setHint("Ops, o mapa molhou. Tente de novo!");
    }
    setIsGenerating(false);
  };

  const getAIHint = async () => {
    setHint("Lendo o mapa... 🗺️");
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: `Você é um pirata amigável ajudando uma criança de 6 anos a aprender a programar.
            A criança está tentando resolver um labirinto 5x5 para pegar uma chave e abrir um baú.
            O programa atual dela é: ${program.length > 0 ? program.join(', ') : 'vazio'}.
            Ela já pegou a chave? ${hasKey ? 'Sim' : 'Não'}.
            Dê uma dica muito curta, encorajadora e simples em português do Brasil. Máximo de 2 frases curtas.
            Exemplo: "Ops! Parece que você esqueceu de usar o bloco Abrir. Tente adicionar o cadeado!"`
        });
        setHint(response.text || "Continue tentando, marujo! O tesouro nos aguarda! ⚓");
    } catch (e) {
        console.error(e);
        setHint("Continue tentando, marujo! O tesouro nos aguarda! ⚓");
    }
  };

  const removeLastCommand = () => {
    if (program.length > 0) {
        setProgram(program.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col font-sans text-slate-800">
      <header className="bg-white p-3 sm:p-4 shadow-sm flex justify-between items-center rounded-b-3xl z-20 relative">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className="text-amber-600 hover:bg-amber-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors font-bold text-sm sm:text-base">
            Voltar
          </button>
          <h1 className="text-base sm:text-2xl font-black text-amber-600">
            Caça ao Tesouro
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold transition-colors text-sm sm:text-base ${hasKey ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400'}`}>
            <Key size={16} className="sm:w-5 sm:h-5" /> {hasKey ? '1' : '0'}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-yellow-600 text-sm sm:text-base">
            <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" /> {stars}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full items-center lg:items-start justify-center mt-4">
        
        {/* Left Column: Game Board */}
        <div className="w-full max-w-md flex flex-col gap-4">
          
          <div className="relative w-full aspect-square bg-amber-200 p-3 rounded-3xl shadow-inner border-4 border-amber-300">
            <div className="w-full h-full grid gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${levelData.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${levelData.size}, minmax(0, 1fr))` }}>
               {Array.from({length: levelData.size}).map((_, y) => 
                  Array.from({length: levelData.size}).map((_, x) => {
                     const isPlayerHere = playerState.x === x && playerState.y === y;
                     const isChest = levelData.chestPos.x === x && levelData.chestPos.y === y;
                     const isKey = levelData.keyPos.x === x && levelData.keyPos.y === y;
                     const isWater = levelData.grid[y][x] === 1;
                     
                     let cellClasses = "relative rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-sm border-4 transition-colors ";
                     if (isWater) {
                         cellClasses += "bg-cyan-400 border-cyan-500"; // Water
                     } else {
                         cellClasses += "bg-amber-100 border-transparent"; // Sand
                     }

                     return (
                        <div key={`${x}-${y}`} className={cellClasses}>
                           {isWater && <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cGF0aCBkPSJNMCA0QzIgNCAyIDggNCA4QzYgOCA2IDQgOCA0IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] rounded-xl"></div>}
                           
                           {isChest && !isPlayerHere && (
                               <span className="text-4xl drop-shadow-md z-0">{gameState === 'won' ? '💎' : '📦'}</span>
                           )}
                           
                           {isKey && !hasKey && !isPlayerHere && (
                               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute z-0 drop-shadow-md">
                                   🗝️
                               </motion.div>
                           )}

                           {isPlayerHere && (
                              <motion.div
                                 layoutId="pirate"
                                 className="absolute inset-0 flex items-center justify-center z-10 text-4xl sm:text-5xl drop-shadow-md"
                                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              >
                                 🏴‍☠️
                              </motion.div>
                           )}
                        </div>
                     );
                  })
               )}
            </div>
          </div>

          {hint && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-md border-2 border-amber-100 flex gap-4 items-start">
               <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
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
               <h2 className="font-bold text-slate-400 uppercase tracking-wider text-sm">Seu Mapa</h2>
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
                  <motion.div layout key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${i === activeCmdIndex ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''} ${cmd === 'OPEN' ? 'bg-yellow-500' : 'bg-amber-600'}`}>
                     {cmd === 'UP' && <ArrowUp size={24} />}
                     {cmd === 'DOWN' && <ArrowDown size={24} />}
                     {cmd === 'LEFT' && <ArrowLeft size={24} />}
                     {cmd === 'RIGHT' && <ArrowRight size={24} />}
                     {cmd === 'OPEN' && <Unlock size={24} />}
                  </motion.div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button disabled={isRunning} onClick={() => setProgram([...program, 'UP'])} className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white p-3 rounded-3xl shadow-[0_8px_0_#b45309] active:shadow-[0_0px_0_#b45309] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowUp size={28} />
               <span className="font-bold text-xs">Cima</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'DOWN'])} className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white p-3 rounded-3xl shadow-[0_8px_0_#b45309] active:shadow-[0_0px_0_#b45309] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowDown size={28} />
               <span className="font-bold text-xs">Baixo</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'OPEN'])} className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-white p-3 rounded-3xl shadow-[0_8px_0_#ca8a04] active:shadow-[0_0px_0_#ca8a04] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <Unlock size={28} />
               <span className="font-bold text-xs">Abrir</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'LEFT'])} className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white p-3 rounded-3xl shadow-[0_8px_0_#b45309] active:shadow-[0_0px_0_#b45309] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowLeft size={28} />
               <span className="font-bold text-xs">Esq.</span>
            </button>
            <button disabled={isRunning} onClick={() => setProgram([...program, 'RIGHT'])} className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white p-3 rounded-3xl shadow-[0_8px_0_#b45309] active:shadow-[0_0px_0_#b45309] active:translate-y-2 transition-all flex flex-col items-center gap-1 disabled:opacity-50 disabled:pointer-events-none">
               <ArrowRight size={28} />
               <span className="font-bold text-xs">Dir.</span>
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
                  💎
               </motion.div>
               <h2 className="text-3xl font-black text-emerald-500 mb-2">Tesouro Encontrado!</h2>
               <p className="text-slate-500 font-bold mb-8">Você pegou a chave e abriu o baú!</p>
               <button onClick={nextLevel} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-bold text-xl shadow-[0_6px_0_#059669] active:shadow-none active:translate-y-1 transition-all">
                  Próximo Mapa
               </button>
            </motion.div>
         </div>
      )}

      {gameState === 'missing_key' && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <div className="text-6xl mb-4">🔒</div>
               <h2 className="text-3xl font-black text-amber-500 mb-2">Trancado!</h2>
               <p className="text-slate-500 font-bold mb-8">
                  Você chegou no baú, mas esqueceu de pegar a chave primeiro!
               </p>
               <div className="flex gap-4">
                  <button onClick={resetLevel} className="flex-1 bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all">
                     Tentar de Novo
                  </button>
                  <button onClick={() => { resetLevel(); getAIHint(); }} className="flex-1 bg-amber-500 text-white p-4 rounded-2xl font-bold shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                     <Bot size={20} /> Dica
                  </button>
               </div>
            </motion.div>
         </div>
      )}

      {(gameState === 'crashed' || gameState === 'failed') && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <div className="text-6xl mb-4">{gameState === 'crashed' ? '🌊' : '🤔'}</div>
               <h2 className="text-3xl font-black text-red-500 mb-2">{gameState === 'crashed' ? 'Ao mar!' : 'Quase lá!'}</h2>
               <p className="text-slate-500 font-bold mb-8">
                  {gameState === 'crashed' ? 'Cuidado para não cair na água!' : 'O Pirata não conseguiu abrir o baú.'}
               </p>
               <div className="flex gap-4">
                  <button onClick={resetLevel} className="flex-1 bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all">
                     Tentar de Novo
                  </button>
                  <button onClick={() => { resetLevel(); getAIHint(); }} className="flex-1 bg-amber-500 text-white p-4 rounded-2xl font-bold shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
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
                  🗺️
               </motion.div>
               <h2 className="text-2xl font-black text-amber-500 mb-2">Desenhando Mapa...</h2>
               <p className="text-slate-500 font-bold">O Pirata está preparando um novo desafio!</p>
            </div>
         </div>
      )}
    </div>
  );
}
