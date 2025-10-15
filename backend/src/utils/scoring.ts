/**
 * 🎯 Sistema de Scoring - Modo Kahoot
 * 
 * Fórmulas de puntuación:
 * - Base points: 1000 puntos por respuesta correcta
 * - Speed bonus: 0-500 puntos según velocidad de respuesta
 * - Combo multiplier: 1 + (combo * 0.1) - Incrementa con racha de aciertos
 */

export interface ScoreCalculation {
  basePoints: number;
  speedBonus: number;
  comboMultiplier: number;
  totalPoints: number;
  wasCorrect: boolean;
}

/**
 * Calcular speed bonus basado en tiempo de respuesta
 * @param timeTaken - Tiempo que tardó en responder (segundos)
 * @param timeLimit - Tiempo límite de la pregunta (segundos)
 * @returns Bonus de velocidad (0-500 puntos)
 */
export function calculateSpeedBonus(timeTaken: number, timeLimit: number): number {
  if (timeTaken >= timeLimit) return 0;
  
  // Fórmula: 500 * (1 - timeTaken / timeLimit)
  // Si responde inmediatamente: 500 puntos
  // Si responde al final: 0 puntos
  const speedRatio = 1 - (timeTaken / timeLimit);
  const bonus = Math.round(500 * speedRatio);
  
  return Math.max(0, Math.min(500, bonus));
}

/**
 * Calcular multiplicador de combo
 * @param comboStreak - Racha de respuestas correctas consecutivas
 * @returns Multiplicador (1.0 = 100%, 1.1 = 110%, etc.)
 */
export function calculateComboMultiplier(comboStreak: number): number {
  // Cada respuesta correcta aumenta 10% el multiplicador
  // Combo 0: 1.0x
  // Combo 1: 1.0x (primera correcta no da bonus)
  // Combo 2: 1.1x (+10%)
  // Combo 3: 1.2x (+20%)
  // Máximo: 2.0x (a partir de combo 10)
  
  if (comboStreak <= 1) return 1.0;
  
  const multiplier = 1 + ((comboStreak - 1) * 0.1);
  return Math.min(2.0, multiplier); // Cap at 2.0x
}

/**
 * Calcular puntos totales de una respuesta
 * @param isCorrect - Si la respuesta fue correcta
 * @param timeTaken - Tiempo de respuesta en segundos
 * @param timeLimit - Tiempo límite en segundos
 * @param currentCombo - Racha actual de respuestas correctas
 * @returns Objeto con desglose de puntuación
 */
export function calculateScore(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number,
  currentCombo: number
): ScoreCalculation {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      comboMultiplier: 1.0,
      totalPoints: 0,
      wasCorrect: false,
    };
  }

  const basePoints = 1000;
  const speedBonus = calculateSpeedBonus(timeTaken, timeLimit);
  const comboMultiplier = calculateComboMultiplier(currentCombo + 1); // +1 porque aún no se actualizó
  
  const subtotal = basePoints + speedBonus;
  const totalPoints = Math.round(subtotal * comboMultiplier);

  return {
    basePoints,
    speedBonus,
    comboMultiplier,
    totalPoints,
    wasCorrect: true,
  };
}

/**
 * Calcular recompensas finales basadas en ranking
 * @param rank - Posición final (1 = primero, 2 = segundo, etc.)
 * @param totalPlayers - Total de jugadores
 * @param gameScore - Puntuación total del juego
 * @returns Recompensas (XP, coins, gems, trophies)
 */
export interface GameRewards {
  xp: number;
  coins: number;
  gems: number;
  trophies: number;
}

export function calculateGameRewards(
  rank: number,
  totalPlayers: number,
  gameScore: number
): GameRewards {
  let xp = 0;
  let coins = 0;
  let gems = 0;
  let trophies = 0;

  // Recompensas base por participación
  xp = 100;
  coins = 10;

  // Bonus por ranking
  if (rank === 1) {
    // 🥇 Primer lugar
    xp += 800;
    coins += 100;
    gems += 5;
    trophies += 3;
  } else if (rank === 2) {
    // 🥈 Segundo lugar
    xp += 500;
    coins += 50;
    gems += 3;
    trophies += 2;
  } else if (rank === 3) {
    // 🥉 Tercer lugar
    xp += 300;
    coins += 30;
    gems += 1;
    trophies += 1;
  } else if (rank <= 5) {
    // Top 5
    xp += 150;
    coins += 20;
  } else if (rank <= 10) {
    // Top 10
    xp += 50;
    coins += 10;
  }

  // Bonus por puntuación alta
  if (gameScore >= 20000) {
    xp += 200;
    coins += 20;
  } else if (gameScore >= 15000) {
    xp += 100;
    coins += 10;
  } else if (gameScore >= 10000) {
    xp += 50;
    coins += 5;
  }

  return { xp, coins, gems, trophies };
}

/**
 * Calcular accuracy (precisión) del jugador
 * @param correctAnswers - Número de respuestas correctas
 * @param totalQuestions - Total de preguntas respondidas
 * @returns Porcentaje de accuracy (0-100)
 */
export function calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}
