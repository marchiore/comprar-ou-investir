console.log("index carregou");
// =======================
// FINANCIAMENTO - PRICE
// =======================
export function calcularFinanciamentoPrice(valorFinanciado, taxaMensal, meses) {
    const i = taxaMensal;
    const n = meses;
  
    const parcela =
      valorFinanciado *
      (i * Math.pow(1 + i, n)) /
      (Math.pow(1 + i, n) - 1);
  
    let saldo = valorFinanciado;
  
    const parcelas = [];
    const amortizacoes = [];
    const jurosArr = [];
    const saldoDevedor = [];
  
    for (let m = 0; m < meses; m++) {
      const juros = saldo * i;
      const amortizacao = parcela - juros;
  
      saldo -= amortizacao;
  
      parcelas.push(parcela);
      amortizacoes.push(amortizacao);
      jurosArr.push(juros);
      saldoDevedor.push(Math.max(saldo, 0));
    }
  
    return { parcelas, amortizacoes, juros: jurosArr, saldoDevedor };
  }
  
  // =======================
  // FINANCIAMENTO - SAC
  // =======================
  export function calcularFinanciamentoSAC(valorFinanciado, taxaMensal, meses) {
    const amortizacao = valorFinanciado / meses;
  
    let saldo = valorFinanciado;
  
    const parcelas = [];
    const amortizacoes = [];
    const jurosArr = [];
    const saldoDevedor = [];
  
    for (let i = 0; i < meses; i++) {
      const juros = saldo * taxaMensal;
      const parcela = amortizacao + juros;
  
      saldo -= amortizacao;
  
      parcelas.push(parcela);
      amortizacoes.push(amortizacao);
      jurosArr.push(juros);
      saldoDevedor.push(Math.max(saldo, 0));
    }
  
    return { parcelas, amortizacoes, juros: jurosArr, saldoDevedor };
  }
  
  // =======================
  // WRAPPER FINANCIAMENTO
  // =======================
  export function calcularFinanciamento(tipo, valor, taxa, meses) {
    if (tipo === "SAC") {
      return calcularFinanciamentoSAC(valor, taxa, meses);
    }
    return calcularFinanciamentoPrice(valor, taxa, meses);
  }
  
  // =======================
  // INVESTIMENTO
  // =======================
  export function calcularSerieInvestimento(valorInicial, aporteMensal, taxaMensal, meses) {
    let saldo = valorInicial;
    const serie = [];
  
    for (let i = 0; i < meses; i++) {
      saldo = saldo * (1 + taxaMensal) + aporteMensal;
      serie.push(saldo);
    }
  
    return serie;
  }
  
  // =======================
  // COMPARAÇÃO
  // =======================
  export function calcularPatrimonioFinal(serie) {
    return serie[serie.length - 1] || 0;
  }
  
  export function compararCenarios(compra, investir) {
    if (compra > investir) {
      return { melhor: "comprar", diferenca: compra - investir };
    }
    return { melhor: "investir", diferenca: investir - compra };
  }
  