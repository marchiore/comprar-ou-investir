import Decimal from "decimal.js";

const DEV_MODE =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");

function toDecimal(value) {
  return Decimal.isDecimal(value) ? value : new Decimal(value);
}

function toNumber(value) {
  return Decimal.isDecimal(value) ? value.toNumber() : value;
}


// =======================
// FINANCIAMENTO - PRICE
// =======================
export function calcularFinanciamentoPrice(valorFinanciado, taxaMensal, meses) {
  const valor = toDecimal(valorFinanciado);
  const i = toDecimal(taxaMensal);
  const n = meses;

  let parcela;

  if (i.eq(0)) {
    parcela = valor.div(n);
  } else {
    const fator = new Decimal(1).plus(i).pow(n);
    parcela = valor.mul(i.mul(fator)).div(fator.minus(1));
  }

  let saldo = valor;

  const parcelas = [];
  const amortizacoes = [];
  const jurosArr = [];
  const saldoDevedor = [];

  let totalJuros = new Decimal(0);

  for (let m = 0; m < meses; m++) {
    const juros = saldo.mul(i);
    let amortizacao = parcela.minus(juros);

    if (m === meses - 1) {
      amortizacao = saldo;
    }

    saldo = saldo.minus(amortizacao);

    parcelas.push(toNumber(parcela));
    amortizacoes.push(toNumber(amortizacao));
    jurosArr.push(toNumber(juros));
    saldoDevedor.push(Math.max(toNumber(saldo), 0));

    totalJuros = totalJuros.plus(juros);
  }

  sanityCheckPrice({
    valorFinanciado: toNumber(valor),
    jurosTotal: toNumber(totalJuros),
    totalPago: toNumber(valor.plus(totalJuros)),
    prazoMeses: meses
  });

  return {
    parcelas,
    amortizacoes,
    juros: jurosArr,
    saldoDevedor,

    totalJuros: toNumber(totalJuros),
    totalPago: toNumber(valor.plus(totalJuros)),
    primeiraParcela: parcelas[0] || 0,
    ultimaParcela: parcelas[parcelas.length - 1] || 0
  };
}

// =======================
// FINANCIAMENTO - SAC
// =======================
export function calcularFinanciamentoSAC(valorFinanciado, taxaMensal, meses) {
  const valor = toDecimal(valorFinanciado);
  const taxa = toDecimal(taxaMensal);
  const amortizacaoBase = valor.div(meses);
  let saldo = valor;

  const parcelas = [];
  const amortizacoes = [];
  const jurosArr = [];
  const saldoDevedor = [];

  let totalJuros = new Decimal(0);

  for (let i = 0; i < meses; i++) {
    const juros = saldo.mul(taxa);

    let amortizacao =
      i === meses - 1 ? saldo : amortizacaoBase;

    const parcela = amortizacao.plus(juros);

    saldo = saldo.minus(amortizacao);

    parcelas.push(toNumber(parcela));
    amortizacoes.push(toNumber(amortizacao));
    jurosArr.push(toNumber(juros));
    saldoDevedor.push(Math.max(toNumber(saldo), 0));

    totalJuros = totalJuros.plus(juros);
  }

  sanityCheckFinanciamentoSac({
    valorFinanciado: toNumber(valor),
    jurosTotal: toNumber(totalJuros),
    totalPago: toNumber(valor.plus(totalJuros)),
    prazoMeses: meses
  });

  return {
    parcelas,
    amortizacoes,
    juros: jurosArr,
    saldoDevedor,

    totalJuros: toNumber(totalJuros),
    totalPago: toNumber(valor.plus(totalJuros)),
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
  const taxa = toDecimal(taxaMensal);
  const aporte = toDecimal(aporteMensal);
  let saldo = toDecimal(valorInicial);
  const serie = [];
  let totalAportado = toDecimal(valorInicial);

  for (let i = 0; i < meses; i++) {
    saldo = saldo.mul(new Decimal(1).plus(taxa)).plus(aporte);
    totalAportado = totalAportado.plus(aporte);
    serie.push(toNumber(saldo));
  }

  return {
    serie,
    patrimonioFinal: toNumber(saldo),
    totalAportado: toNumber(totalAportado)
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
