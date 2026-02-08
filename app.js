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
    const taxaFinanciamentoAnual = parseFloat(document.getElementById('taxaFinanciamento').value.replace(',', '.')) / 100;
    const prazoFinanciamento = parseInt(document.getElementById('prazoFinanciamento').value) * 12;
    const taxaInvestimentoAnual = parseFloat(document.getElementById('taxaInvestimento').value.replace(',', '.')) / 100;
    const aporteMensal = parseMoeda(document.getElementById('aporteMensal').value);
    const prazoInvestimento = parseInt(document.getElementById('prazoInvestimento').value);

    // Validações
    if (!valorImovel || !valorEntrada || !taxaFinanciamentoAnual || !prazoFinanciamento || !taxaInvestimentoAnual || !prazoInvestimento) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    const valorFinanciado = valorImovel - valorEntrada;

    if (valorFinanciado <= 0) {
        alert('O valor da entrada deve ser menor que o valor do imóvel!');
        return;
    }

    // Calcular financiamento usando funções do calc.js
    const taxaFinanciamentoMensal = Math.pow(1 + taxaFinanciamentoAnual, 1 / 12) - 1;
    const taxaInvestimentoMensal = Math.pow(1 + taxaInvestimentoAnual, 1 / 12) - 1;

    let dadosFinanciamento;
    if (tipoFinanciamento === 'SAC') {
        dadosFinanciamento = calcularFinanciamentoSAC(valorFinanciado, taxaFinanciamentoMensal, prazoFinanciamento);
    } else {
        dadosFinanciamento = calcularFinanciamentoPrice(valorFinanciado, taxaFinanciamentoMensal, prazoFinanciamento);
    }

    const totalPago = dadosFinanciamento.parcelas.reduce((a, b) => a + b, 0);
    const totalJuros = dadosFinanciamento.juros.reduce((a, b) => a + b, 0);
    const patrimonioFinanciamento = valorImovel; // Após pagar, você tem o imóvel

    // Calcular investimento usando função do calc.js
    const investimento = calcularSerieInvestimento(
        valorEntrada,
        aporteMensal,
        taxaInvestimentoMensal,
        prazoInvestimento
    );
    
    const patrimonioInvestimento = investimento.patrimonioFinal;
    const totalAportado = investimento.totalAportado - valorEntrada;
    
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
    const diferencaInfo = document.getElementById('diferencaInfo');
    const diferenca = patrimonioInvestimento - patrimonioFinanciamento;
    const sinalDiferenca = diferenca >= 0 ? '+' : '-';

    const mensagem = `
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">
            <strong>Racional do cálculo</strong>
        </p>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            A comparação considera o mesmo horizonte de ${prazoInvestimento} meses. No financiamento, o patrimônio final é o valor do imóvel após a quitação. No investimento, o patrimônio final é o capital inicial somado aos aportes mensais, capitalizados pela taxa informada.
        </p>
        <p style="margin-bottom: 0.75rem;">
            Diferença de patrimônio (Investimento − Financiamento): 
            <span class="diff-badge diff-positive">${sinalDiferenca}${formatarMoeda(Math.abs(diferenca))}</span>
        </p>
        <p style="color: var(--text-secondary);">
            Essa diferença apenas expressa a distância entre os patrimônios finais; a interpretação depende das premissas usadas.
        </p>
    `;
    diferencaInfo.innerHTML = mensagem;

    // Mostrar resultados
    document.getElementById('results').classList.add('active');
    
    // Scroll suave até os resultados
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

console.log('Calculadora Financeira carregada! ✨');