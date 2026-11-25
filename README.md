<div align="center">
    <img src="./resources/logo.svg" width="128" alt="PlayXbox Enhanced Logo" />
    <h1>PlayXbox Enhanced</h1>
    <p><strong>Aprimoramentos para o Xbox Cloud Gaming no navegador Desktop (<code>play.xbox.com</code>)</strong></p>
    <!-- Latest Version Badge -->
    <a href="https://github.com/mtsdmsc/PlayXbox-Enhanced/releases"><img src="https://img.shields.io/github/v/release/mtsdmsc/PlayXbox-Enhanced?label=latest" alt="Latest version" /></a>
    <!-- Total Downloads Badge -->
    <a href="https://github.com/mtsdmsc/PlayXbox-Enhanced/releases"><img src="https://img.shields.io/github/downloads/mtsdmsc/PlayXbox-Enhanced/total?color=%23e15f2c" alt="Total downloads" /></a>
    <!-- Total Stars Badge -->
    <a href="https://github.com/mtsdmsc/PlayXbox-Enhanced/stargazers"><img src="https://img.shields.io/github/stars/mtsdmsc/PlayXbox-Enhanced?color=%23cca400" alt="Total stars" /></a>
</div>

---

### Melhore sua experiência no Xbox Cloud Gaming (xCloud) em navegadores **Desktop** no novo domínio [play.xbox.com](https://play.xbox.com) (com compatibilidade também para [xbox.com/play](https://www.xbox.com/play)), incluindo Remote Play, controle de tempo de jogo, atalhos no controle e tradução nativa para Português (Brasil).

> [!NOTE]
> O **PlayXbox Enhanced** é um fork independente voltado para **Desktop** mantido por [**Mateus Damasceno (@mtsdmsc)**](https://github.com/mtsdmsc), construído sobre a base do projeto original [**Better xCloud**](https://github.com/redphx/better-xcloud), criado por [**@redphx**](https://github.com/redphx).  
> O foco exclusivo deste projeto é oferecer uma experiência estável e completa na nova interface do **`play.xbox.com`** em navegadores de **computador (PC, Mac, Linux e SteamOS)**.

> [!IMPORTANT]
> **Apenas Desktop:** Esta versão **não oferece suporte** a dispositivos móveis (Android / iOS) nem Smart TVs. Para Android / Android TV, utilize o aplicativo oficial do projeto original: [redphx/better-xcloud-android](https://github.com/redphx/better-xcloud-android).

---

## 🖥️ Plataformas e Navegadores Suportados

- **Sistemas Operacionais:** Windows, macOS, Linux e SteamOS (incluindo Steam Deck em modo Desktop/navegador)
- **Navegadores recomendados:** Microsoft Edge, Google Chrome, Brave, Opera, Vivaldi e Firefox (Desktop)
- **Gerenciadores de Userscript:** [**Tampermonkey**](https://www.tampermonkey.net/) ou [**Violentmonkey**](https://violentmonkey.github.io/)

---

## ✨ O que foi adaptado neste porte (`play.xbox.com`)

Com a migração do Xbox Cloud Gaming para o novo domínio `play.xbox.com`, a interface passou a utilizar uma nova estrutura de DOM, rotas sem o prefixo `/xx-XX/play` e políticas rígidas de segurança (CSP). Este porte inclui:

- **Suporte híbrido de domínio (`@match`):** funciona nativamente em `https://play.xbox.com/*` e também em `https://www.xbox.com/*/play*`.
- **Tradução nativa para Português (Brasil) (`pt-BR`):** todas as strings de interface estão embutidas diretamente no script, funcionando mesmo sob o bloqueio de CSP do `play.xbox.com`.
- **Injeção de UI na nova barra superior:** detecção reativa via `MutationObserver` no cabeçalho (`<nav>`) para exibir os botões do **PlayXbox Enhanced** (com indicador de região/servidor) e **Remote Play**, além dos atalhos globais `Alt + Shift + X` (menu) e `Alt + Shift + E` (estatísticas).
- **Menu Guia (HUD / `#NexusId`), Atalhos e Personalização do Controle:** integração completa no novo DOM do `play.xbox.com`, atalhos de controle (`Xbox + botão`), remapeamento com badges visuais do Xbox e isolamento de foco sem travar o controle.
- **Monitor de Tempo de Jogo:** sincroniza automaticamente a cota mensal exibida no painel Xbox e emite alerta visual vermelho de 10s a cada 30 minutos de sessão.
- **Limpeza da Tela Inicial e Qualidade de Stream:** ocultação de todas as 11 seções do `play.xbox.com`, remoção automática do diálogo pós-jogo (*"Como foi sua sessão?"*), tempo de fila nos cartões (incluindo *Voltar a jogar*), **1080p (HQ)**, controle de bitrate/codec, **Clarity Boost**, **WebGL2 / WebGPU**, **Mouse e Teclado (MKB)** e **Remote Play**.

---

## 🚀 Como Instalar

1. Instale a extensão [**Tampermonkey**](https://www.tampermonkey.net/) ou [**Violentmonkey**](https://violentmonkey.github.io/) no seu navegador Desktop.
2. Clique no link abaixo para instalar o script compilado diretamente deste repositório:
   - 👉 [**Instalar PlayXbox Enhanced (`better-xcloud.user.js`)**](https://raw.githubusercontent.com/mtsdmsc/PlayXbox-Enhanced/main/dist/better-xcloud.user.js)
   - *(Ou baixe a versão mais recente na aba [**Releases**](https://github.com/mtsdmsc/PlayXbox-Enhanced/releases)).*
3. Acesse [**play.xbox.com**](https://play.xbox.com) e aproveite!

---

## 🛠️ Como Compilar Localmente

Este projeto utiliza [**Bun**](https://bun.sh/) para compilação do código TypeScript.

```bash
# 1. Instale as dependências
bun install

# 2. Compile o userscript (substitua pela versão desejada)
bun run build.ts --version 1.0.0 --pretty --meta
bun run build.ts --version 1.0.0 --meta
```

Os arquivos finais serão gerados na pasta `dist/`:
- `dist/better-xcloud.user.js` (versão de produção)
- `dist/better-xcloud.pretty.user.js` (versão formatada para leitura/debug)
- `dist/better-xcloud.meta.js` (metadados de versão)

---

## 🤖 Inteligências Artificiais Utilizadas no Projeto

O mapeamento arquitetural, diagnóstico de DOM/rede, refatoração dos módulos TypeScript, tradução nativa `pt-BR` e adaptação completa do **Better xCloud** para o novo site `play.xbox.com` foram realizados em colaboração com as seguintes IAs na plataforma **Google Antigravity**:

- **Claude Sonnet 5.5** *(Anthropic)* — Análise de impacto, diagnóstico arquitetural da transição `xbox.com/play` → `play.xbox.com`, mapeamento de seletores DOM e implementação inicial do porte.
- **Gemini 4** *(Google DeepMind)* — Adaptação completa de UI, Menu Guia, interceptadores de rede, tradução `pt-BR` nativa embutida, correções de compatibilidade com o cliente React do `play.xbox.com`, compilação e documentação.

---

## 👤 Autor do Porte & Créditos Originais

### Porte Desktop para `play.xbox.com`
- **Mateus Damasceno** — [@mtsdmsc](https://github.com/mtsdmsc)
- **Repositório do Porte:** [github.com/mtsdmsc/PlayXbox-Enhanced](https://github.com/mtsdmsc/PlayXbox-Enhanced)

### Criador Original do Better xCloud
Todo o mérito pela concepção, arquitetura base e desenvolvimento original do **Better xCloud** pertence a:
- **Criador Original:** [**@redphx**](https://github.com/redphx)
- **Repositório Oficial Original:** [github.com/redphx/better-xcloud](https://github.com/redphx/better-xcloud)
- **Documentação Oficial do Projeto Base:** [better-xcloud.github.io](https://better-xcloud.github.io)
- **Apoie o Criador Original:** [Ko-fi (@redphx)](https://ko-fi.com/redphx)

### Agradecimentos Adicionais (Projeto Base)
- Recurso de controle por mouse inspirado no recurso *"Mouse spinning"* do [emulador Yuzu](https://github.com/yuzu-emu/yuzu-mainline)
- [n-thumann/xbox-cloud-server-selector](https://github.com/n-thumann/xbox-cloud-server-selector) pela ideia do recurso de IPv6
- Ícones por [Phosphor Icons](https://phosphoricons.com)
- [PromptFont](https://shinmera.com/promptfont) por Yukari "Shinmera" Hafner

---

## ⚠️ Avisos Legais (Disclaimers)
- Use por sua própria conta e risco.
- Ao relatar bugs específicos deste porte Desktop para o `play.xbox.com`, abra uma [Issue neste repositório](https://github.com/mtsdmsc/PlayXbox-Enhanced/issues) (não reporte problemas deste fork nos canais oficiais do `@redphx` ou no `/r/xcloud`).
- Este projeto não possui qualquer afiliação com a Microsoft ou Xbox. Todos os logotipos, ícones e marcas registradas do Xbox pertencem aos seus respectivos proprietários.
