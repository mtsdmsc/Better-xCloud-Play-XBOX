import { PrompFont } from "./prompt-font";

export enum GamepadKey {
    A = 0,
    B = 1,
    X = 2,
    Y = 3,
    LB = 4,
    RB = 5,
    LT = 6,
    RT = 7,
    SELECT = 8,
    START = 9,
    L3 = 10,
    R3 = 11,
    UP = 12,
    DOWN = 13,
    LEFT = 14,
    RIGHT = 15,
    HOME = 16,
    SHARE = 17,

    LS_UP = 100,
    LS_DOWN = 101,
    LS_LEFT = 102,
    LS_RIGHT = 103,
    LS = 104,

    RS_UP = 200,
    RS_DOWN = 201,
    RS_LEFT = 202,
    RS_RIGHT = 203,
    RS = 204,
};

export const GamepadKeyName: Record<number, [string, PrompFont]> = {
    [GamepadKey.A]: ['Botão A (Verde)', PrompFont.A],
    [GamepadKey.B]: ['Botão B (Vermelho)', PrompFont.B],
    [GamepadKey.X]: ['Botão X (Azul)', PrompFont.X],
    [GamepadKey.Y]: ['Botão Y (Amarelo)', PrompFont.Y],

    [GamepadKey.LB]: ['Botão Superior Esquerdo (LB)', PrompFont.LB],
    [GamepadKey.RB]: ['Botão Superior Direito (RB)', PrompFont.RB],
    [GamepadKey.LT]: ['Gatilho Esquerdo (LT)', PrompFont.LT],
    [GamepadKey.RT]: ['Gatilho Direito (RT)', PrompFont.RT],

    [GamepadKey.SELECT]: ['Botão Visualizar / View (Select)', PrompFont.SELECT],
    [GamepadKey.START]: ['Botão Menu (Start)', PrompFont.START],
    [GamepadKey.HOME]: ['Botão Xbox (Guia)', PrompFont.HOME],

    [GamepadKey.UP]: ['Direcional Cima (D-Pad ↑)', PrompFont.UP],
    [GamepadKey.DOWN]: ['Direcional Baixo (D-Pad ↓)', PrompFont.DOWN],
    [GamepadKey.LEFT]: ['Direcional Esquerda (D-Pad ←)', PrompFont.LEFT],
    [GamepadKey.RIGHT]: ['Direcional Direita (D-Pad →)', PrompFont.RIGHT],

    [GamepadKey.L3]: ['Clique do Analógico Esquerdo (L3)', PrompFont.L3],
    [GamepadKey.LS_UP]: ['Analógico Esquerdo Cima (LS ↑)', PrompFont.LS_UP],
    [GamepadKey.LS_DOWN]: ['Analógico Esquerdo Baixo (LS ↓)', PrompFont.LS_DOWN],
    [GamepadKey.LS_LEFT]: ['Analógico Esquerdo Esquerda (LS ←)', PrompFont.LS_LEFT],
    [GamepadKey.LS_RIGHT]: ['Analógico Esquerdo Direita (LS →)', PrompFont.LS_RIGHT],
    [GamepadKey.LS]: ['Analógico Esquerdo (LS)', PrompFont.LS],

    [GamepadKey.R3]: ['Clique do Analógico Direito (R3)', PrompFont.R3],
    [GamepadKey.RS_UP]: ['Analógico Direito Cima (RS ↑)', PrompFont.RS_UP],
    [GamepadKey.RS_DOWN]: ['Analógico Direito Baixo (RS ↓)', PrompFont.RS_DOWN],
    [GamepadKey.RS_LEFT]: ['Analógico Direito Esquerda (RS ←)', PrompFont.RS_LEFT],
    [GamepadKey.RS_RIGHT]: ['Analógico Direito Direita (RS →)', PrompFont.RS_RIGHT],
    [GamepadKey.RS]: ['Analógico Direito (RS)', PrompFont.RS],

    [GamepadKey.SHARE]: ['Botão Compartilhar / Captura de Tela (Share)', PrompFont.SHARE],
};


export enum GamepadStick {
    LEFT = 0,
    RIGHT = 1,
};
