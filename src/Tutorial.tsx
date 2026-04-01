import { motion } from 'motion/react';
import { Sparkles, Bot, ListOrdered, Repeat } from 'lucide-react';

interface TutorialProps {
  onBack: () => void;
}

export default function Tutorial({ onBack }: TutorialProps) {
  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-sans text-slate-800">
      <header className="bg-white p-3 sm:p-4 shadow-sm flex items-center rounded-b-3xl z-20 relative">
        <button onClick={onBack} className="text-indigo-500 hover:bg-indigo-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors font-bold text-sm sm:text-base">
          Voltar
        </button>
        <h1 className="text-base sm:text-2xl font-black text-indigo-600 ml-4">
          O Mundo da Programação
        </h1>
      </header>
      
      <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6 sm:gap-8 pb-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-4 border-indigo-100 text-center"
        >
          <Bot className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-500 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-indigo-600 mb-4">O que é Programar?</h2>
          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Imagine que os computadores, robôs e até os foguetes são muito rápidos, mas eles não sabem o que fazer sozinhos. Eles precisam de um <strong>chefe</strong>. E adivinha? <strong>Esse chefe é você!</strong>
          </p>
          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed mt-4">
            Programar é como dar uma receita de bolo ou um mapa do tesouro para o computador. Você usa blocos de comandos para dizer exatamente o que ele deve fazer, passo a passo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-orange-50 p-6 sm:p-8 rounded-[2rem] border-4 border-orange-200"
          >
            <ListOrdered className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mb-4" />
            <h3 className="text-xl sm:text-2xl font-black text-orange-600 mb-2">1. Passo a Passo</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              A regra mais importante é a <strong>Sequência</strong>. O computador lê os seus comandos um por um, de cima para baixo. Se você mandar o pirata pular antes de andar, ele vai pular no lugar errado!
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 p-6 sm:p-8 rounded-[2rem] border-4 border-purple-200"
          >
            <Repeat className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 mb-4" />
            <h3 className="text-xl sm:text-2xl font-black text-purple-600 mb-2">2. Repetição</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Cansado de colocar o mesmo bloco várias vezes? Use o <strong>Loop</strong> (repetição)! Ele faz o computador repetir uma ação quantas vezes você quiser, sem você ter que escrever tudo de novo.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl text-white text-center relative overflow-hidden"
        >
          <Sparkles className="absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 text-yellow-300 opacity-50" />
          <h2 className="text-2xl sm:text-4xl font-black mb-4">Seus Superpoderes!</h2>
          <p className="text-base sm:text-xl font-medium text-white/90 leading-relaxed mb-8">
            Agora que você já sabe como funciona, está na hora de testar seus novos superpoderes. Escolha um dos nossos jogos na tela inicial e comece a sua aventura!
          </p>
          <button onClick={onBack} className="bg-yellow-400 text-yellow-900 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-black text-lg sm:text-xl shadow-[0_6px_0_#ca8a04] active:shadow-none active:translate-y-1 transition-all hover:bg-yellow-300">
            Começar a Jogar!
          </button>
        </motion.div>
      </main>
    </div>
  );
}
