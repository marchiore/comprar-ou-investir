import {
    calcularFinanciamentoPrice,
    calcularFinanciamentoSAC,
    calcularSerieInvestimento
} from './calc.js';

// =======================
// FORMATAÇÃO DE MOEDA
// =======================
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseMoeda(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function formatarInput(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor === '') {
        input.value = '';
        return;
    }
    valor = (parseInt(valor) / 100).toFixed(2);
    input.value = valor.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatarPercentual(input) {
    let valor = input.value.replace(/[^\d,]/g, '');
    if (valor === '') {
        input.value = '';
        return;
    }
    input.value = valor;
}

// Aplicar formatação em tempo real
document.querySelectorAll('input[type="text"]').forEach(input => {
    if (input.id.includes('taxa')) {
        input.addEventListener('input', () => formatarPercentual(input));
    } else {
        input.addEventListener('input', () => formatarInput(input));
    }
});

// =======================
// CÁLCULO PRINCIPAL
// =======================
window.calcular = function() {
    // Pegar valores
    const valorImovel = parseMoeda(document.getElementById('valorImovel').value);
    const valorEntrada = parseMoeda(document.getElementById('valorEntrada').value);
    const tipoFinanciamento = document.getElementById('tipoFinanciamento').value;
    const taxaFinanciamento = parseFloat(document.getElementById('taxaFinanciamento').value.replace(',', '.')) / 100;
    const prazoFinanciamento = parseInt(document.getElementById('prazoFinanciamento').value);
    const taxaInvestimento = parseFloat(document.getElementById('taxaInvestimento').value.replace(',', '.')) / 100;
    const aporteMensal = parseMoeda(document.getElementById('aporteMensal').value);
    const prazoInvestimento = parseInt(document.getElementById('prazoInvestimento').value);

    // Validações
    if (!valorImovel || !valorEntrada || !taxaFinanciamento || !prazoFinanciamento || !taxaInvestimento || !prazoInvestimento) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    const valorFinanciado = valorImovel - valorEntrada;

    if (valorFinanciado <= 0) {
        alert('O valor da entrada deve ser menor que o valor do imóvel!');
        return;
    }

    // Calcular financiamento usando funções do calc.js
    let dadosFinanciamento;
    if (tipoFinanciamento === 'SAC') {
        dadosFinanciamento = calcularFinanciamentoSAC(valorFinanciado, taxaFinanciamento, prazoFinanciamento);
    } else {
        dadosFinanciamento = calcularFinanciamentoPrice(valorFinanciado, taxaFinanciamento, prazoFinanciamento);
    }

    const totalPago = dadosFinanciamento.parcelas.reduce((a, b) => a + b, 0);
    const totalJuros = dadosFinanciamento.juros.reduce((a, b) => a + b, 0);
    const patrimonioFinanciamento = valorImovel; // Após pagar, você tem o imóvel

    // Calcular investimento usando função do calc.js
    const serieInvestimento = calcularSerieInvestimento(valorEntrada, aporteMensal, taxaInvestimento, prazoInvestimento);
    const patrimonioInvestimento = serieInvestimento[serieInvestimento.length - 1];
    const totalAportado = aporteMensal * prazoInvestimento;
    const rendimentoTotal = patrimonioInvestimento - valorEntrada - totalAportado;

    // Atualizar UI - Financiamento
    document.getElementById('valorFinanciado').textContent = formatarMoeda(valorFinanciado);
    document.getElementById('totalPago').textContent = formatarMoeda(totalPago + valorEntrada);
    document.getElementById('totalJuros').textContent = formatarMoeda(totalJuros);
    document.getElementById('patrimonioFinanciamento').textContent = formatarMoeda(patrimonioFinanciamento);

    // Atualizar UI - Investimento
    document.getElementById('capitalInicial').textContent = formatarMoeda(valorEntrada);
    document.getElementById('totalAportado').textContent = formatarMoeda(totalAportado);
    document.getElementById('rendimentoTotal').textContent = formatarMoeda(rendimentoTotal);
    document.getElementById('patrimonioInvestimento').textContent = formatarMoeda(patrimonioInvestimento);

    // Comparação
    const scenarioFinanciamento = document.getElementById('scenarioFinanciamento');
    const scenarioInvestimento = document.getElementById('scenarioInvestimento');
    const diferencaInfo = document.getElementById('diferencaInfo');

    scenarioFinanciamento.classList.remove('winner');
    scenarioInvestimento.classList.remove('winner');

    let mensagem = '';
    if (patrimonioInvestimento > patrimonioFinanciamento) {
        scenarioInvestimento.classList.add('winner');
        const diferenca = patrimonioInvestimento - patrimonioFinanciamento;
        mensagem = `
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">
                <strong>Investir é mais vantajoso!</strong> Você terá <span class="diff-badge diff-positive">${formatarMoeda(diferenca)}</span> a mais investindo do que comprando o imóvel.
            </p>
            <p style="color: var(--text-secondary);">
                Considerando o mesmo período de ${prazoInvestimento} meses, investir o valor da entrada e fazer aportes mensais resulta em um patrimônio maior.
            </p>
        `;
    } else {
        scenarioFinanciamento.classList.add('winner');
        const diferenca = patrimonioFinanciamento - patrimonioInvestimento;
        mensagem = `
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">
                <strong>Comprar é mais vantajoso!</strong> Você terá <span class="diff-badge diff-positive">${formatarMoeda(diferenca)}</span> a mais em patrimônio comprando o imóvel.
            </p>
            <p style="color: var(--text-secondary);">
                Considerando o mesmo período de ${prazoFinanciamento} meses, comprar o imóvel resulta em um patrimônio maior do que investir.
            </p>
        `;
    }
    diferencaInfo.innerHTML = mensagem;

    // Preencher tabela de parcelas
    const tbody = document.getElementById('tabelaBody');
    tbody.innerHTML = '';
    
    for (let i = 0; i < Math.min(dadosFinanciamento.parcelas.length, 120); i++) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatarMoeda(dadosFinanciamento.parcelas[i])}</td>
            <td>${formatarMoeda(dadosFinanciamento.juros[i])}</td>
            <td>${formatarMoeda(dadosFinanciamento.amortizacoes[i])}</td>
            <td>${formatarMoeda(dadosFinanciamento.saldoDevedor[i])}</td>
        `;
    }

    // Mostrar resultados
    document.getElementById('results').classList.add('active');
    
    // Scroll suave até os resultados
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

console.log('Calculadora Financeira carregada! ✨');