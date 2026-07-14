import type { EquationItem } from '@/store/gameStore';

/**
 * Avalia uma sequência de EquationItems como uma expressão matemática.
 * Respeita precedência: * e / antes de + e -.
 * Retorna o valor numérico ou null se a expressão for inválida.
 * 
 * NÃO usa eval() — parser manual seguro.
 */
export function evaluateExpression(items: EquationItem[]): number | null {
  if (items.length === 0) return null;

  // Um único número
  if (items.length === 1) {
    if (items[0].type !== 'number') return null;
    return Number(items[0].value);
  }

  // Validar estrutura: deve alternar número-operador-número...
  // Posições pares (0, 2, 4...) devem ser números
  // Posições ímpares (1, 3, 5...) devem ser operadores (exceto =)
  for (let i = 0; i < items.length; i++) {
    if (i % 2 === 0) {
      if (items[i].type !== 'number') return null;
    } else {
      if (items[i].type !== 'operator') return null;
      if (items[i].value === '=') return null; // = não faz parte de um lado da expressão
    }
  }

  // Deve terminar com um número (tamanho ímpar)
  if (items.length % 2 === 0) return null;

  // Extrair números e operadores
  const numbers: number[] = [];
  const operators: string[] = [];

  for (let i = 0; i < items.length; i++) {
    if (i % 2 === 0) {
      numbers.push(Number(items[i].value));
    } else {
      operators.push(String(items[i].value));
    }
  }

  // Fase 1: resolver * e / (maior precedência)
  const reducedNumbers: number[] = [numbers[0]];
  const reducedOperators: string[] = [];

  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    const nextNum = numbers[i + 1];

    if (op === '*') {
      reducedNumbers[reducedNumbers.length - 1] *= nextNum;
    } else if (op === '/') {
      if (nextNum === 0) return null; // Divisão por zero
      reducedNumbers[reducedNumbers.length - 1] /= nextNum;
    } else {
      reducedNumbers.push(nextNum);
      reducedOperators.push(op);
    }
  }

  // Fase 2: resolver + e -
  let result = reducedNumbers[0];
  for (let i = 0; i < reducedOperators.length; i++) {
    if (reducedOperators[i] === '+') {
      result += reducedNumbers[i + 1];
    } else if (reducedOperators[i] === '-') {
      result -= reducedNumbers[i + 1];
    }
  }

  return result;
}

/**
 * Valida uma equação completa.
 * Separa os itens pelo sinal "=" e compara os valores de cada lado.
 * Retorna true se ambos os lados têm o mesmo valor, false se não, null se a estrutura é inválida.
 */
export function validateEquation(items: EquationItem[]): boolean | null {
  if (items.length < 3) return null;

  // Encontrar a posição do "="
  const equalIndex = items.findIndex(item => item.type === 'operator' && item.value === '=');
  if (equalIndex === -1) return null;

  // Verificar que não há mais de um "="
  const secondEqual = items.findIndex((item, idx) => idx > equalIndex && item.type === 'operator' && item.value === '=');
  if (secondEqual !== -1) return null;

  // O = não pode estar no início ou no fim
  if (equalIndex === 0 || equalIndex === items.length - 1) return null;

  const leftSide = items.slice(0, equalIndex);
  const rightSide = items.slice(equalIndex + 1);

  const leftValue = evaluateExpression(leftSide);
  const rightValue = evaluateExpression(rightSide);

  if (leftValue === null || rightValue === null) return null;

  // Comparação com tolerância para ponto flutuante
  return Math.abs(leftValue - rightValue) < 0.0001;
}

/**
 * Determina o tipo esperado para o próximo slot com base nos itens já inseridos.
 * Regra: posições pares = número, posições ímpares = operador.
 * Exceção: o slot após um "=" recomeça a contagem (número).
 */
export function getExpectedTypeForNextSlot(items: EquationItem[]): 'number' | 'operator' {
  if (items.length === 0) return 'number';

  // Encontrar a posição do "=" 
  const equalIndex = items.findIndex(item => item.type === 'operator' && item.value === '=');
  
  if (equalIndex !== -1 && items.length > equalIndex) {
    // Estamos no lado direito do "="
    const rightSideLength = items.length - equalIndex - 1;
    return rightSideLength % 2 === 0 ? 'number' : 'operator';
  }

  // Estamos no lado esquerdo (ou sem = ainda)
  return items.length % 2 === 0 ? 'number' : 'operator';
}

/**
 * Verifica se a equação contém exatamente um sinal "=".
 */
export function hasEqualSign(items: EquationItem[]): boolean {
  return items.some(item => item.type === 'operator' && item.value === '=');
}

/**
 * Verifica se a equação tem estrutura mínima válida para verificação (ao menos N = N).
 */
export function isReadyToCheck(items: EquationItem[]): boolean {
  if (!hasEqualSign(items)) return false;
  if (items.length < 3) return false;

  const equalIndex = items.findIndex(item => item.type === 'operator' && item.value === '=');
  
  // Deve ter pelo menos 1 item de cada lado
  const leftSide = items.slice(0, equalIndex);
  const rightSide = items.slice(equalIndex + 1);
  
  if (leftSide.length === 0 || rightSide.length === 0) return false;

  // Ambos os lados devem terminar com número (tamanho ímpar)
  if (leftSide.length % 2 === 0 || rightSide.length % 2 === 0) return false;

  return true;
}
