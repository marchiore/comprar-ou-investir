const DEV_MODE =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");


// =======================
// FINANCIAMENTO - PRICE
// =======================
export function calcularFinanciamentoPrice(valorFinanciado, taxaMensal, meses) {
  const i = taxaMensal;
  const n = meses;

  let parcela;

  if (i === 0) {
    parcela = valorFinanciado / n;
  } else {
    parcela =
      valorFinanciado *
      (i * Math.pow(1 + i, n)) /
      (Math.pow(1 + i, n) - 1);
  }

  let saldo = valorFinanciado;

  const parcelas = [];
  const amortizacoes = [];
  const jurosArr = [];
  const saldoDevedor = [];

  let totalJuros = 0;

  for (let m = 0; m < meses; m++) {
    const juros = saldo * i;
    let amortizacao = parcela - juros;

    if (m === meses - 1) {
      amortizacao = saldo;
    }

    saldo -= amortizacao;

    parcelas.push(parcela);
    amortizacoes.push(amortizacao);
    jurosArr.push(juros);
    saldoDevedor.push(Math.max(saldo, 0));

    totalJuros += juros;
  }

  sanityCheckPrice({
    valorFinanciado,
    jurosTotal: totalJuros,
    totalPago: valorFinanciado + totalJuros,
    prazoMeses: meses
  });

  return {
    parcelas,
    amortizacoes,
    juros: jurosArr,
    saldoDevedor,

    totalJuros,
    totalPago: valorFinanciado + totalJuros,
    primeiraParcela: parcelas[0] || 0,
    ultimaParcela: parcelas[parcelas.length - 1] || 0
  };
}

// =======================
// FINANCIAMENTO - SAC
// =======================
export function calcularFinanciamentoSAC(valorFinanciado, taxaMensal, meses) {
  let amortizacaoBase = valorFinanciado / meses;
  let saldo = valorFinanciado;

  const parcelas = [];
  const amortizacoes = [];
  const jurosArr = [];
  const saldoDevedor = [];

  let totalJuros = 0;

  for (let i = 0; i < meses; i++) {
    const juros = saldo * taxaMensal;

    let amortizacao =
      i === meses - 1 ? saldo : amortizacaoBase;

    const parcela = amortizacao + juros;

    saldo -= amortizacao;

    parcelas.push(parcela);
    amortizacoes.push(amortizacao);
    jurosArr.push(juros);
    saldoDevedor.push(Math.max(saldo, 0));

    totalJuros += juros;
  }

  sanityCheckFinanciamentoSac({
    valorFinanciado,
    jurosTotal: totalJuros,
    totalPago: valorFinanciado + totalJuros,
    prazoMeses: meses
  });

  return {
    parcelas,
    amortizacoes,
    juros: jurosArr,
    saldoDevedor,

    totalJuros,
    totalPago: valorFinanciado + totalJuros,
    primeiraParcela: parcelas[0] || 0,
    ultimaParcela: parcelas[parcelas.length - 1] || 0
  };
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
export function calcularSerieInvestimento(
  valorInicial,
  aporteMensal,
  taxaMensal,
  meses
) {
  let saldo = valorInicial;
  const serie = [];
  let totalAportado = valorInicial;

  for (let i = 0; i < meses; i++) {
    saldo = saldo * (1 + taxaMensal) + aporteMensal;
    totalAportado += aporteMensal;
    serie.push(saldo);
  }

  return {
    serie,
    patrimonioFinal: saldo,
    totalAportado
  };
}

// =======================
// PATRIMÔNIO COMPRA
// =======================
export function calcularPatrimonioCompra(
  valorImovelFinal,
  financiamento
) {
  const saldoFinal =
    financiamento.saldoDevedor[
      financiamento.saldoDevedor.length - 1
    ] || 0;

  return valorImovelFinal - saldoFinal;
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

function sanityCheckFinanciamentoSac({
  valorFinanciado,
  jurosTotal,
  totalPago,
  prazoMeses
}) {
  if (!DEV_MODE) return;

  console.group("🧪 SANITY CHECK FINANCIAMENTO");

  const percentualJuros = jurosTotal / valorFinanciado;

  if (percentualJuros < 0.05) {
    console.warn("🚨 Juros extremamente baixos — provavelmente cálculo errado");
  }

  if (totalPago < valorFinanciado) {
    console.error("🚨 Total pago menor que valor financiado — impossível");
  }

  if (prazoMeses <= 0) {
    console.error("🚨 Prazo inválido");
  }

  console.log("Valor financiado:", valorFinanciado);
  console.log("Juros total:", jurosTotal);
  console.log("Total pago:", totalPago);
  console.log("Percentual juros:", (percentualJuros * 100).toFixed(2) + "%");

  console.groupEnd();
}

function sanityCheckPrice({
  valorFinanciado,
  parcela,
  jurosTotal,
  totalPago,
  primeiraParcelaJuros,
  ultimaParcelaJuros
}) {
  if (!DEV_MODE) return;

  console.group("🧪 SANITY CHECK PRICE");

  if (parcela <= 0) {
    console.error("🚨 Parcela inválida");
  }

  if (totalPago < valorFinanciado) {
    console.error("🚨 Total pago menor que financiamento — impossível");
  }

  if (primeiraParcelaJuros < ultimaParcelaJuros) {
    console.warn("🚨 Juros não estão diminuindo — provável erro no cálculo");
  }

  const percentualJuros = jurosTotal / valorFinanciado;

  if (percentualJuros < 0.1) {
    console.warn("🚨 Juros muito baixos para PRICE — suspeito");
  }

  console.log("Valor financiado:", valorFinanciado);
  console.log("Parcela:", parcela);
  console.log("Total pago:", totalPago);
  console.log("Juros total:", jurosTotal);

  console.groupEnd();
}
