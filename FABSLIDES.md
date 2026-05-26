# FABSLIDES.md — Skill Técnica Canônica do Motor de Apresentações HTML5

> **Para agentes de IA:** Este é o documento vivo de referência técnica do FabSlides.
> Leia este arquivo antes de criar, modificar ou diagnosticar qualquer apresentação baseada no motor.
> Mantenha-o atualizado após cada nova funcionalidade implementada ou decisão de design consolidada.

---

## 0. Identidade e Localização do Projeto

| Campo | Valor |
|---|---|
| **Repositório canônico** | `C:\Users\fabio\OneDrive\Sync\Dev\FabSlides` |
| **Boilerplate base** | `C:\Users\fabio\OneDrive\Sync\Dev\FabSlides\boilerplate\` |
| **README do projeto** | `C:\Users\fabio\OneDrive\Sync\Dev\FabSlides\README.md` |
| **Versão atual** | v4.1 |
| **Apresentação de referência** | `C:\Users\fabio\OneDrive\Sync\Cofre\Mestrado\1T26_FGEC\Aula 11 - Apresentação dos trabalhos finais\FLL_Apresentação-A11\` |
| **Manual derivado** | `…\Aula 11\PRESENTATION_ENGINE.md` |

---

## 1. Arquitetura de Arquivos Obrigatória

Todo projeto FabSlides deve seguir esta estrutura de pastas:

```
meu-projeto/
├── index.html            # Projetor — tela de projeção para o público
├── style.css             # Design System — tokens, tipografia, animações
├── main.js               # Lógica — scroll, passos, teclado, WebSocket client
│
├── apresentador/
│   └── index.html        # Console — cockpit do orador com notas e Gaveta de Referências
│
├── remoto/
│   └── index.html        # Controle Remoto — interface touch mobile com cronômetro
│
├── server/
│   ├── index.js          # Servidor de Sinalização WebSocket (Node.js)
│   ├── package.json      # Dependências mínimas (ws@8)
│   └── Dockerfile        # Deploy em nuvem (Coolify / Docker)
│
└── material/             # Assets estáticos: PDFs, Markdowns de referência
```

---

## 2. Glossário de Nomes Oficiais

> Ao interagir com o usuário ou escrever código, use sempre os termos da coluna **Termo Oficial**.

| Termos Informais / Sinônimos | Termo Oficial FabSlides |
|---|---|
| Slide Frame, Snap, Tela | **Slide** |
| Ações, Revelações, Steps, Animações Locais | **Passos (Steps)** |
| Projetor, Palco, Tela Cheia | **Projetor (Projector)** |
| Cockpit, Painel, Console | **Console (Presenter Console)** |
| Controle, Celular, Remoto Mobile | **Controle Remoto (Remote)** |
| Servidor, Sinalizador, Relay | **Servidor (Signaling Server)** |
| Notas, Roteiro, Talking Points | **Notas de Palco (Stage Notes)** |
| Drawer, Sidebar, Gaveta | **Gaveta de Referências (Reference Drawer)** |
| Tipo de Ação, Categoria de Step | **Action Type** |

---

## 3. Mecanismo Central — Storytelling por Passos

### 3.1 O atributo `data-step`

Cada elemento que deve ser revelado em sequência recebe `data-step="N"` (N começa em 1).

**Regras obrigatórias:**
- Elementos estruturais fixos (cabeçalhos, rodapés, labels) **NÃO** recebem `data-step` — entram visíveis imediatamente.
- A numeração deve ser contínua e crescente dentro de cada `<section>`.
- O JS lê todos os `[data-step]` da seção ativa e os ordena numericamente.

### 3.2 Comportamento de Revelação

| Gatilho de Navegação | Comportamento |
|---|---|
| **Seta Direita / Barra de Espaço** | Revela o próximo passo (storytelling de palco sequencial) |
| **Seta Esquerda** | Oculta o último passo revelado (retrocesso local) |
| **Seta Baixo / Scroll** | Vai ao próximo slide exibindo **todos** os passos imediatamente |
| **Seta Cima** | Volta ao slide anterior exibindo **todos** os passos imediatamente |
| **Clique no indicador lateral** | Vai ao slide clicado exibindo **todos** os passos imediatamente |

### 3.3 CSS Base de Revelação

```css
[data-step] {
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
[data-step].active-step {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 4. Taxonomia Conceitual de Design e Storytelling (3 Níveis Lógicos)

O FabSlides organiza a anatomia, o design de interface e a física de animação dos slides em **três níveis lógicos independentes**. Isso remove a complexidade dos termos brutos de CSS e JS, oferecendo uma linguagem pura de design declarativo para agentes de IA e desenvolvedores.

```
Nível 1: CAMADA ESTRUTURAL (Onde se localiza no slide?)
   │
   ├── Nível 2: TIPO DE COMPONENTE (Qual é a função do elemento?)
   │      │
   │      └── Nível 3: COMPORTAMENTO DINÂMICO (Como ele se revela / reage?)
```

---

### Nível 1: Camada Estrutural (A Área de Atuação)
Define o posicionamento macro e o escopo de atuação do elemento dentro da tela-canvas do slide:

1.  **`Camada de Cabeçalho (Header)`**: Zona superior imediata de ambientação e ancoragem do slide.
2.  **`Camada de Conteúdo (Body)`**: Zona principal (área útil central) destinada aos dados, diagramas e discussões.
3.  **`Camada de Rodapé (Footer)`**: Zona inferior focada em notas e elementos de apoio.

---

### Nível 2: Tipo de Componente (A Função Semântica)
Define a estrutura semântica e visual utilizada para contar a história em cada camada.

*   **Na Camada de Cabeçalho:**
    *   `Cabeçalho Ancorador`: Título principal + categoria do slide.
    *   `Bloco de Contextualização`: Texto corrido ou citação introdutória de ambientação.
*   **Na Camada de Conteúdo:**
    *   `Card de Destaque Métrico`: Bloco focado em exibir estatísticas monumentais e rotulagens.
    *   `Card de Mídia Geográfica`: Painel dedicado a mapas estáticos em alta definição e marcadores dinâmicos.
    *   `Painel de Abas Lineares`: Sistema de exibição de abas sincronizadas a mídias sob o mesmo passo.
    *   `Diagrama de Processo`: SVG estruturado ou fluxo conectado, composto por `Etapas do Fluxo`.
    *   `Coluna de Contraste`: Divisões paralelas de layout para exibição paralela (ex: Split-Screen 50/50).
*   **Na Camada de Rodapé:**
    *   `Legenda Mapeadora`: Tradutor visual de cores, siglas e termos da teoria.
    *   `Nota Legal ou Referência`: Citações normativas, fontes e selos regulatórios.

---

### Nível 3: Comportamento Dinâmico (A Física de Revelação)
Define a transição e a movimentação visual de um elemento de storytelling no seu respectivo passo (`data-step`).

1.  **`Entrada Imediata`** (`static`): O elemento é exibido instantaneamente ao carregar o slide (Estado 0).
2.  **`Revelação Elevada`** (`slide-up`): O elemento surge com uma transição suave subindo fisicamente e esmaecendo na tela. Padrão para cartões de status e blocos de fechamento.
3.  **`Iluminação Local`** (`highlight`): O elemento já está renderizado no slide em tom sutil (opacidade ~0.25) e "acende" com 100% de cor e destaque no seu passo correspondente, garantindo integridade visual à tela.
4.  **`Comutação Exclusiva`** (`linear-tabs`): A revelação esconde o conteúdo anterior de forma exclusiva, ativando e pausando mídias (vídeos) sincronizadas.
5.  **`Transição Geométrica`** (`physical-stretch`): Altera fisicamente a largura, altura ou proporção geométrica de um elemento na tela (ex: autoclaves ou linhas do tempo).
6.  **`Gatilho Reativo`** (`pulse`): Dispara micro-animações cíclicas e infinitas (como marcadores de pulso) a partir da revelação do contêiner.

---

## 5. Feature Library (Boilerplates Prontos)

Esta biblioteca contém os blocos canônicos de código (HTML, CSS e JS) prontos para replicação em qualquer apresentação FabSlides.

### Feature 1: Diagrama de Processo Interativo com Iluminação Local

Estrutura ideal para apresentar fluxos de engenharia, sequenciamentos temporais ou VSMs mantendo o diagrama esteticamente visível em segundo plano sem quebrar o layout da tela.

#### 1. HTML Declarativo
```html
<div class="vsm-svg-wrapper">
  <svg viewBox="0 0 1000 160" width="100%" height="100%">
    <!-- Nó do Diagrama (Física: Iluminação Local) -->
    <g class="vsm-node" data-step="1" transform="translate(20, 20)">
      <rect x="0" y="0" width="130" height="90" rx="6" fill="#FFFFFF" stroke="#3A7DCA" stroke-width="2.5"/>
      <rect x="0" y="0" width="130" height="24" rx="6 6 0 0" fill="#3A7DCA"/>
      <text x="65" y="16" fill="#FFFFFF" font-size="10" font-family="Outfit" font-weight="700" text-anchor="middle">RECEÇÃO & TRIAGEM</text>
      <text x="65" y="48" fill="#0B1E36" font-size="11" font-family="Outfit" font-weight="700" text-anchor="middle">Janela de Safra</text>
      <text x="65" y="65" fill="#5A6E85" font-size="9" font-family="Outfit" text-anchor="middle">Tempo: ~2 h (F)</text>
    </g>
    
    <!-- Seta Conectora Simples -->
    <path d="M 160 65 L 180 65" stroke="#5A6E85" stroke-width="2" marker-end="url(#arrow)"/>
  </svg>
</div>
```

#### 2. CSS Canônico
```css
/* Estado Inicial: Opacidade de Fundo */
g[data-step] {
  opacity: 0.25;
  transition: opacity 0.5s ease, filter 0.5s ease;
}

/* Estado Ativo: Iluminado com Sombra Projetada */
g[data-step].active-step {
  opacity: 1.0;
  filter: drop-shadow(0px 8px 15px rgba(11, 30, 54, 0.12));
}
```

#### 3. JS de Storytelling
O motor genérico adiciona `.active-step` sequencialmente. Nenhuma lógica imperativa por slide é necessária, pois a física de iluminação é gerida de forma puramente declarativa através do seletor CSS do elemento SVG.

---

### Feature 2: Slide de Contraste Semântico (Eixo A vs. Eixo B)

Esta categoria é usada para criar um choque visual e conceitual direto entre duas perspectivas (ex: "Antes vs. Depois", "Tradicional vs. Lean", "Pilares Ativos vs. Gargalos"). Funciona semântica e visualmente como **"dois slides dentro de um"** dividindo a atenção do espectador em dois eixos de storytelling.

A engine do FabSlides expõe **duas variações visuais** para esta mesma categoria:

---

#### Variação A: Split-Screen (Full-Bleed / Tela Dividida)
Ocupa 100% da viewport dividida ao meio, ideal para apresentar conceitos antagônicos monumentais (Design do Slide 04).

##### 1. HTML Declarativo e Mapeamento Humano (3 Níveis)
```html
<section class="slide-section full-bleed" id="slide-contraste-split">
  <div class="slide-frame">
    <!-- Nível 1 (Cabeçalho): Cabeçalho Ancorador Global -->
    <header class="slide-header" style="padding-left: 5rem;">
      <p class="slide-category">04 · Fundamentação Teórica</p>
      <h2 class="slide-title">Teorias de Gestão da Produção</h2>
    </header>

    <div class="slide-content-area" data-content>
      <div class="theory-split-container">
        
        <!-- Coluna Esquerda: Argumento A -->
        <div class="theory-split-col dark-side" data-step="1">
          <!-- Nível 2 (Componente): Badge -->
          <div class="agro-card-badge">Visão Tradicional</div>
          
          <!-- Nível 2 (Componente): Título do Argumento -->
          <h3 class="agro-card-title">O Modelo de Conversão</h3>
          
          <p class="agro-card-text">
            <!-- Nível 2 (Componente): Título do Contraponto -->
            <strong>A ilusão de enxergar apenas a tarefa</strong><br>
            <!-- Nível 2 (Componente): Definição do Contraponto -->
            Enxerga a produção como uma sequência de transformações mecânicas isoladas...
          </p>
          
          <!-- Nível 2 (Componente): Consequência -->
          <div class="highlight-impact">
            Consequência: <em>Otimizações locais ineficazes que geram desperdício.</em>
          </div>
        </div>

        <!-- Coluna Direita: Argumento B -->
        <div class="theory-split-col light-side" data-step="2">
          <!-- Nível 2 (Componente): Badge -->
          <div class="agro-card-badge">Abordagem de Fluxos</div>
          <!-- Nível 2 (Componente): Título do Argumento -->
          <h3 class="agro-card-title">A Teoria de Fluxos</h3>
          <p class="agro-card-text">
            <strong>A distinção científica de Koskela (1992)</strong><br>
            Demonstra que a produção é constituída por duas dimensões...
          </p>
          <!-- Nível 2 (Componente): Consequência -->
          <div class="highlight-impact">
            Consequência: <em>Foco expandido para reduzir tempos de fluxo inútil.</em>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>
```

---

#### Variação B: Cards Pareados (Centered Grid / Diagnóstico Balanceado)
Mantém o cabeçalho fixo no topo e divide a área útil central em cartões amplos lado a lado, ideal para diagnósticos e aplicações críticas de teoria (Design do Slide 07).

##### 1. HTML Declarativo e Mapeamento Humano (3 Níveis)
```html
<section class="slide-section" id="slide-contraste-cards">
  <div class="slide-frame">
    <!-- Nível 1 (Cabeçalho): Cabeçalho Ancorador Global -->
    <header class="slide-header">
      <p class="slide-category">07 · Análise Crítica</p>
      <h2 class="slide-title">Aplicação dos Princípios ao Processo Real</h2>
    </header>

    <div class="slide-content-area" data-content>
      <div class="agro-analysis-container">
        
        <!-- Cartão Esquerda: Diagnóstico A -->
        <div class="agro-card" data-step="1">
          <!-- Nível 2 (Componente): Badge -->
          <div class="agro-card-badge active"><span>✅ Pilares Ativos</span></div>
          
          <!-- Nível 2 (Componente): Título do Argumento -->
          <h3 class="agro-card-title">Valor & Perfeição</h3>
          
          <!-- Nível 2 (Componente): Definição do Contraponto -->
          <p class="agro-card-text">
            O valor sensorial e a busca por perfeição através de regulação operam ativamente...
          </p>
        </div>

        <!-- Cartão Direita: Diagnóstico B -->
        <div class="agro-card" data-step="2">
          <!-- Nível 2 (Componente): Badge -->
          <div class="agro-card-badge alert"><span>⚠️ Gargalos Estruturais</span></div>
          
          <!-- Nível 2 (Componente): Título do Argumento -->
          <h3 class="agro-card-title">Fluxo Contínuo & Produção Puxada</h3>
          
          <!-- Nível 2 (Componente): Definição do Contraponto -->
          <p class="agro-card-text">
            A linearidade esbarra nas restrições biológicas e na janela sazonal de safra...
          </p>
        </div>

      </div>
    </div>
  </div>
</section>
```

##### 2. CSS Canônico da Variação B (Cards Pareados)
```css
.agro-analysis-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.5rem;
  width: 100%;
}

.agro-card {
  background: var(--color-card-bg);
  padding: 3.5rem;
  border-radius: 8px;
  box-shadow: 0 15px 40px rgba(11, 30, 54, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s ease;
}

/* Fisica: Entrada em Cascata */
.agro-card[data-step] {
  opacity: 0;
  transform: translateY(20px);
}

.agro-card[data-step].active-step {
  opacity: 1;
  transform: translateY(0);
}

/* Sotaque do Destaque de Consequência */
.highlight-impact {
  margin-top: 2rem;
  padding: 1.2rem 1.5rem;
  border-left: 3px solid var(--color-orange);
  background: rgba(224, 90, 16, 0.04);
}
```

### Feature 3: Slide de Explicação de Teoria (Citation + Principle Cards)

Esta feature foi criada especificamente para apresentar novos referenciais teóricos e escolas de pensamento acadêmico. Funciona dividindo o slide horizontalmente em duas fases: a **Ambientação Teórica** (foco na citação e na obra) e a **Exploração de Pilares** (cards ou itens revelados progressivamente com os princípios contrapostos).

#### 1. HTML Declarativo e Mapeamento Humano (3 Níveis)
```html
<section class="slide-section dark" id="slide-teoria-exemplo">
  <div class="slide-frame">
    <!-- Nível 1 (Cabeçalho): Cabeçalho Ancorador Global -->
    <header class="slide-header">
      <p class="slide-category">06 · Fundamentação Teórica</p>
      <h2 class="slide-title">Os Pilares da Escola Clássica</h2>
    </header>

    <div class="slide-content-area" data-content>
      <div class="theory-wrapper">
        <div class="theory-block">
          
          <!-- Nível 2 (Componente): Bloco de Citação -->
          <!-- [Humano: Contém a Citação, Autor(es), Ano e Artigo/Obra de referência] -->
          <div class="theory-icon">“</div>
          <p class="theory-quote">
            "Frase de impacto que resume a tese do pensador com fechamento correto de aspas."
          </p>
          <p class="theory-ref">Autor(es) (Ano) · Obra de Referência</p>
          
          <!-- Nível 2 (Componente): Lista de Princípios -->
          <!-- [Humano: Lista de cards com contrapontos da teoria para storytelling progressivo] -->
          <div class="theory-principles-list">
            
            <!-- Item 1 (Física: Revelação Elevada) -->
            <div class="theory-principle-item" data-step="1">
              <strong>1. Nome do Princípio</strong>
              <span>Definição rápida de aplicação prática ou contraposição.</span>
            </div>

            <!-- Item 2 (Física: Revelação Elevada) -->
            <div class="theory-principle-item" data-step="2">
              <strong>2. Segundo Princípio</strong>
              <span>Nova definição conceitual alinhada à tese.</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### 2. CSS Canônico (Layout Teórico)
```css
/* Bloco de Citação */
.theory-block {
  text-align: left;
  position: relative;
}

.theory-icon {
  font-family: var(--font-title);
  font-size: 5rem;
  color: var(--color-orange);
  line-height: 1;
  margin-bottom: -1rem;
}

.theory-quote {
  font-size: 1.8rem;
  font-style: italic;
  line-height: 1.5;
  color: var(--color-text-light);
  margin-bottom: 2rem;
}

.theory-ref {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-orange);
  letter-spacing: 0.1em;
  margin-bottom: 3rem;
}

/* Lista de Princípios */
.theory-principles-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 2.5rem;
}

.theory-principle-item {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.theory-principle-item strong {
  font-size: 1.3rem;
  color: var(--color-text-light);
}

.theory-principle-item span {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

/* Física: Entrada de Itens */
.theory-principle-item[data-step] {
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.theory-principle-item[data-step].active-step {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 6. Protocolo de Sincronização WebSocket
