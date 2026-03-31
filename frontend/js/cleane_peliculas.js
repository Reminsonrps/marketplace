// 1. Configurações Iniciais
const API_URL = "http://localhost:3000"; 

const container = document.getElementById('cards');
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');
let carrinho = [];
let todosOsProdutos = [];

// --- ISOLAMENTO DE CLIENTE ---
function gerarIdUnico() {
  return 'user-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}
let userId = localStorage.getItem("userId") || (function() {
  const newId = gerarIdUnico();
  localStorage.setItem("userId", newId);
  return newId;
})();

// --- GESTÃO DE TOKEN ---
let token = localStorage.getItem("token") || null;

// 2. LOGIN ADMIN
async function loginAdmin() {
  const usuario = prompt("Usuário:");
  const senha = prompt("Senha:");

  if (!usuario || !senha) return;

  try {
    // CORREÇÃO: Mudado de /index para /api/login
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || "Credenciais inválidas");
    }

    const data = await response.json();
    token = data.token;
    localStorage.setItem("token", token);

    alert("Bem-vindo(a), Cleane!");
    window.location.href = "cadastro.html"; 
  } catch (err) {
    console.error("Erro no login:", err);
    alert(err.message || "Erro ao acessar o painel.");
  }
}

// 3. BUSCAR PRODUTOS
async function buscarProdutosDaAPI() {
  try {
    const response = await fetch(`${API_URL}/api/produtos`);
    if (!response.ok) throw new Error("Erro ao buscar dados");
    
    todosOsProdutos = await response.json();
    renderizarCards(todosOsProdutos);
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    if (container) {
        container.innerHTML = `<p style="color: red;">Ops! Servidor offline ou erro ao carregar.</p>`;
    }
  }
}

// 4. RENDERIZAR CARDS
function renderizarCards(listaProdutos) {
  if (!container) return;
  container.innerHTML = '';
  
  listaProdutos.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    const temEstoque = item.estoque > 0;

    card.innerHTML = `
        <img src="${item.imagemUrl}" alt="${item.nome}" style="width:100%; border-radius:8px;">
        <h3>${item.nome}</h3>
        <p>${item.descricao}</p>
        <p style="color: ${temEstoque ? '#28a745' : '#dc3545'}; font-weight: bold;">
            ${temEstoque ? item.estoque + ' disponíveis' : 'Esgotado'}
        </p>
        <span style="font-weight:bold; color:#ff6b81; font-size: 1.2rem;">R$ ${Number(item.preco).toFixed(2)}</span>
        <br><br>
        <button onclick="adicionarAoCarrinho('${item._id}')" 
            ${!temEstoque ? 'disabled style="background:#ccc;"' : ''}>
            ${temEstoque ? 'Adicionar ao Carrinho' : 'Indisponível'}
        </button>
    `;
    container.appendChild(card);
  });
}

// --- FUNÇÕES GLOBAIS (Para o HTML enxergar) ---

window.adicionarAoCarrinho = function(id) {
  const produto = todosOsProdutos.find(p => p._id === id);
  if (produto && produto.estoque > 0) {
    carrinho.push(produto);
    atualizarCarrinho();
  }
};

window.removerDoCarrinho = function(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
};

window.limparCarrinho = function() {
  carrinho = [];
  atualizarCarrinho();
};

window.enviarPedido = function() {
  if (carrinho.length === 0) return alert("Carrinho vazio!");
  let mensagem = `*Novo Pedido - Cleane Películas*%0A%0A`;
  carrinho.forEach(item => {
    mensagem += `• ${item.nome} - R$ ${Number(item.preco).toFixed(2)}%0A`;
  });
  mensagem += `%0A*Total: R$ ${totalSpan.textContent}*`;
  window.open(`https://wa.me/5573991350755?text=${mensagem}`, '_blank');
};

function atualizarCarrinho() {
  if (!lista) return;
  lista.innerHTML = '';
  let total = 0;
  carrinho.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${item.nome} - R$ ${Number(item.preco).toFixed(2)} 
      <button onclick="removerDoCarrinho(${index})" style="color:red; border:none; background:none; cursor:pointer;">[x]</button>`;
    lista.appendChild(li);
    total += Number(item.preco);
  });
  totalSpan.textContent = total.toFixed(2);
}

// Vinculação de eventos e inicialização
document.getElementById("btnLogin")?.addEventListener("click", loginAdmin);
buscarProdutosDaAPI();