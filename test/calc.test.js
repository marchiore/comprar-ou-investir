import { describe, test, expect } from "vitest";
import {
    calcularFinanciamentoSAC,
    calcularFinanciamentoPrice,
    calcularSerieInvestimento
  } from "../calc.js";
  
  function taxaMensal(anual) {
    return Math.pow(1 + anual, 1 / 12) - 1;
  }
  
  describe("FINANCIAMENTO SAC", () => {
  
    test("amortização constante", () => {
      const dados = calcularFinanciamentoSAC(900000, taxaMensal(0.10), 30);
  
      const primeira = dados.amortizacoes[0];
      const ultima = dados.amortizacoes[29];
  
      expect(primeira).toBeCloseTo(ultima, 2);
    });
  
    test("saldo final deve ser zero", () => {
      const dados = calcularFinanciamentoSAC(900000, taxaMensal(0.10), 30);
      expect(dados.saldoDevedor.at(-1)).toBeCloseTo(0, 2);
    });
  
    test("parcelas devem cair ao longo do tempo", () => {
      const dados = calcularFinanciamentoSAC(900000, taxaMensal(0.10), 30);
      expect(dados.parcelas[0]).toBeGreaterThan(dados.parcelas[29]);
    });
  
  });
  
  describe("FINANCIAMENTO PRICE", () => {
  
    test("parcelas fixas", () => {
      const dados = calcularFinanciamentoPrice(900000, taxaMensal(0.10), 30);
  
      expect(dados.parcelas[0]).toBeCloseTo(dados.parcelas[29], 2);
    });
  
    test("saldo final deve ser zero", () => {
      const dados = calcularFinanciamentoPrice(900000, taxaMensal(0.10), 30);
      expect(dados.saldoDevedor.at(-1)).toBeCloseTo(0, 2);
    });
  
    test("amortização cresce ao longo do tempo", () => {
      const dados = calcularFinanciamentoPrice(900000, taxaMensal(0.10), 30);
      expect(dados.amortizacoes[29]).toBeGreaterThan(dados.amortizacoes[0]);
    });
  
  });
  
  describe("INVESTIMENTO", () => {
  
    test("saldo cresce ao longo do tempo", () => {
      const dados = calcularSerieInvestimento(
        100000,
        25000,
        taxaMensal(0.11),
        24
      );
      expect(dados.serie[23]).toBeGreaterThan(dados.serie[0]);
      expect(dados.serie.length).toBe(24);
    });
  
    test("tamanho da série correto", () => {
      const dados = calcularSerieInvestimento(
        100000,
        25000,
        taxaMensal(0.11),
        24
      );
  
      expect(dados.serie.length).toBe(24);
    });
  
  });
  