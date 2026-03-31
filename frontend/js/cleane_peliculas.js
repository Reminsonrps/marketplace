  // 1. Configurações Iniciais
const container = document.getElementById('cards');
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');
let carrinho = [];
let todosOsProdutos = []; // Variável global para armazenar o que vem da API

// 2. FUNÇÃO PARA BUSCAR PRODUTOS DA API (NODE.JS)
async function buscarProdutosDaAPI() {
    try {
        // Altere para a URL do seu servidor (ex: https://seu-projeto.onrender.com/api/produtos)
        const response = await fetch('http://localhost:3000/api/produtos');
        todosOsProdutos = await response.json();
        renderizarCards(todosOsProdutos);
    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
        container.innerHTML = "<p>Erro ao carregar produtos. Verifique se o servidor está rodando.</p>";
    }
}

// 3. RENDERIZAR OS CARDS NA TELA
function renderizarCards(listaProdutos) {
    container.innerHTML = '';
    
    listaProdutos.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        // Lógica para cor do estoque
        const corEstoque = item.estoque > 0 ? '#28a745' : '#dc3545';
        const textoEstoque = item.estoque > 0 ? `${item.estoque} unidades` : 'Esgotado';

        card.innerHTML = `
            <img src="${item.imagemUrl}" alt="${item.nome}">
            <h3>${item.nome}</h3>
            <p>${item.descricao}</p>
            <div style="margin-bottom: 10px; font-size: 0.85rem; color: ${corEstoque}; font-weight: bold;">
                Disponível: ${textoEstoque}
            </div>
            <span style="font-weight:bold; color:#ff6b81;">R$ ${Number(item.preco).toFixed(2)}</span><br><br>
            
            <button onclick="adicionarAoCarrinho('${item.nome}', ${item.preco})" 
                ${item.estoque <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ''}>
                ${item.estoque > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
            </button>
        `;

        container.appendChild(card);
    });
}

// 4. FILTRAR PRODUTOS (Busca)
function filtrarProdutos() {
    const termo = campoBusca.value.toLowerCase();
    const filtrados = todosOsProdutos.filter(item => 
        item.nome.toLowerCase().includes(termo)
    );
    renderizarCards(filtrados);
}

// 5. LÓGICA DO CARRINHO
function adicionarAoCarrinho(nome, preco) {
    carrinho.push({ nome, preco: Number(preco) });
    atualizarCarrinho();
}

function atualizarCarrinho() {
    lista.innerHTML = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.marginBottom = "5px";
        
        li.innerHTML = `
            <span>${item.nome} - R$ ${item.preco.toFixed(2)}</span>
            <button onclick="removerDoCarrinho(${index})" style="background:none; color:red; border:none; cursor:pointer;">[x]</button>
        `;
        lista.appendChild(li);
        total += item.preco;
    });

    totalSpan.textContent = total.toFixed(2);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

function limparCarrinho() {
    carrinho = [];
    atualizarCarrinho();
}

// 6. ENVIAR PEDIDO VIA WHATSAPP
function enviarPedido() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let mensagem = "Olá! Gostaria de fazer o seguinte pedido de películas:%0A%0A";
    carrinho.forEach(item => {
        mensagem += `• ${item.nome} - R$ ${item.preco.toFixed(2)}%0A`;
    });
    mensagem += `%0A*Total: R$ ${totalSpan.textContent}*`;

    const url = `https://wa.me/5573991350755?text=${mensagem}`;
    window.open(url, '_blank');
}



// Inicializa a busca de dados quando a página abre
buscarProdutosDaAPI();