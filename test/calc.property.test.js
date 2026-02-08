import { describe, test, expect } from "vitest";
import {
    calcularFinanciamentoSAC,
    calcularFinanciamentoPrice
  } from "../calc.js";
  
  function taxaMensal(anual) {
    return Math.pow(1 + anual, 1 / 12) - 1;
  }
  
  function soma(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }
  
  describe("PROPRIEDADES FINANCEIRAS", () => {
  
    test("saldo final sempre deve zerar", () => {
      const dados = calcularFinanciamentoSAC(500000, taxaMensal(0.12), 120);
      expect(dados.saldoDevedor.at(-1)).toBeCloseTo(0, 2);
    });
  
    test("amortizações devem somar o valor financiado", () => {
      const valor = 800000;
      const dados = calcularFinanciamentoPrice(valor, taxaMensal(0.09), 240);
  
      expect(soma(dados.amortizacoes)).toBeCloseTo(valor, 2);
    });
  
    test("juros nunca devem ser negativos", () => {
      const dados = calcularFinanciamentoPrice(900000, taxaMensal(0.1), 30);
      dados.juros.forEach(j => {
        expect(j).toBeGreaterThanOrEqual(0);
      });
    });
  
  });
  