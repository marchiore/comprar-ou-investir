import { describe, test, expect } from "vitest";
import {
    calcularFinanciamentoSAC,
    calcularFinanciamentoPrice
  } from "../calc.js";
  
  function taxaMensal(anual) {
    return Math.pow(1 + anual, 1 / 12) - 1;
  }
  
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  describe("FUZZ TEST FINANCIAMENTO", () => {
  
    test("1000 cenários aleatórios", () => {
  
      for (let i = 0; i < 1000; i++) {
  
        const valor = random(50000, 2000000);
        const taxa = taxaMensal(random(0.04, 0.18));
        const prazo = Math.floor(random(12, 420));
  
        const sac = calcularFinanciamentoSAC(valor, taxa, prazo);
        const price = calcularFinanciamentoPrice(valor, taxa, prazo);
  
        expect(sac.saldoDevedor.at(-1)).toBeCloseTo(0, 2);
        expect(price.saldoDevedor.at(-1)).toBeCloseTo(0, 2);
  
        expect(sac.parcelas.length).toBe(prazo);
        expect(price.parcelas.length).toBe(prazo);
  
      }
  
    });
  
  });

  