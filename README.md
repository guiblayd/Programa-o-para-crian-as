# 🚀 CodeKids - Lógica de Programação para Crianças

Um aplicativo web educativo, interativo e gamificado, criado especialmente para introduzir crianças a partir de 6 anos ao mundo da lógica de programação. Através de desafios visuais e divertidos, os pequenos aprendem conceitos fundamentais de computação de forma intuitiva!

## 🎮 Os Jogos

O aplicativo é composto por 4 minijogos principais, cada um focado em desenvolver habilidades cognitivas e lógicas específicas:

- 👨‍🍳 **Mestre Cuca:** Ensina **sequenciamento lógico**. A criança precisa organizar os blocos de ação na ordem correta para preparar receitas deliciosas.
- 🎨 **Robô Pintor:** Introduz o conceito de **padrões e repetição (loops)**. O jogador comanda um robô para pintar o chão formando desenhos específicos.
- 🏴‍☠️ **Caça ao Tesouro:** Focado em **algoritmos de navegação e condicionais**. O pirata precisa encontrar a chave e chegar ao baú do tesouro, desviando de obstáculos pelo caminho.
- 🚀 **Foguete Espacial:** Trabalha **orientação espacial e planejamento de rotas**. O objetivo é guiar o foguete até o planeta destino usando comandos de direção.

## ✨ Principais Funcionalidades

- **Interface Kids-Friendly:** Design colorido, botões grandes, ícones intuitivos e textos simplificados.
- **Totalmente Responsivo:** Jogue no computador, tablet ou celular com a mesma qualidade de experiência. A interface se adapta perfeitamente a telas menores.
- **Gamificação:** Sistema de recompensas com estrelas ao completar as fases, incentivando a progressão e o aprendizado contínuo.
- **Inteligência Artificial (Gemini):** Integração com a API do Google Gemini para gerar novos níveis dinamicamente e fornecer dicas inteligentes e amigáveis quando a criança tiver dificuldade.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS
- **Animações:** Framer Motion
- **Ícones:** Lucide React
- **IA:** `@google/genai` (Google Gemini API)

## 🚀 Como Executar o Projeto Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```
2. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base) e adicione sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY="sua_chave_de_api_aqui"
   ```
3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
4. Acesse o link local gerado no terminal (geralmente `http://localhost:3000`) no seu navegador.

## 📁 Estrutura do Projeto

- `/src/games/`: Contém os componentes principais e a lógica de cada minijogo (`ChefGame.tsx`, `PainterGame.tsx`, `PirateGame.tsx`, `RocketGame.tsx`).
- `/src/App.tsx`: Ponto de entrada que gerencia a navegação entre a tela inicial (Home) e os jogos.
- `/src/index.css`: Arquivo de estilos globais configurado com Tailwind CSS.

---
*Desenvolvido para formar os pensadores e criadores do futuro, brincando!* 🧩💡
