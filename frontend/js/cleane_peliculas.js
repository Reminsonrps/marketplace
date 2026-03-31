// 1. Configurações Iniciais
const API_URL = "https://cleane-peliculas.onrender.com"; 

const container = document.getElementById('cards');
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');

let carrinho = [];
let todosOsProdutos = []; // Lista mestre vinda do banco

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

// 3. BUSCAR PRODUTOS DA API
async function buscarProdutosDaAPI() {
  try {
    const response = await fetch(`${API_URL}/api/produtos`);
    if (!response.ok) throw new Error("Erro ao buscar dados");
    
    todosOsProdutos = await response.json();
    renderizarCards(todosOsProdutos); // Renderiza a lista completa no início
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    if (container) {
        container.innerHTML = `<p style="color: red; text-align: center; grid-column: 1/-1;">
            Ops! Servidor offline ou erro ao carregar.
        </p>`;
    }
  }
}

// 4. LÓGICA DO FILTRO EM TEMPO REAL
campoBusca?.addEventListener('input', () => {
  const termo = campoBusca.value.toLowerCase().trim();
  
  // Filtra na lista mestre (sem precisar ir no banco de novo)
  const produtosFiltrados = todosOsProdutos.filter(p => 
    p.nome.toLowerCase().includes(termo) || 
    p.descricao.toLowerCase().includes(termo)
  );

  renderizarCards(produtosFiltrados);
});

// 5. RENDERIZAR CARDS NO HTML
function renderizarCards(listaProdutos) {
  if (!container) return;
  container.innerHTML = '';
  
  if (listaProdutos.length === 0) {
    container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: #999;">
        Nenhuma película encontrada com esse nome. 🌸
    </p>`;
    return;
  }

  listaProdutos.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    const temEstoque = item.estoque > 0;

    card.innerHTML = `
        <img src="${item.imagemUrl}" alt="${item.nome}" style="width:100%; border-radius:8px;">
        <h3>${item.nome}</h3>
        <p>${item.descricao}</p>
        <p style="color: ${temEstoque ? '#28a745' : '#dc3545'}; font-weight: bold;">
            ${temEstoque ? item.estoque + ' em estoque' : 'Esgotado'}
        </p>
        <span style="font-weight:bold; color:#ff6b81; font-size: 1.2rem;">
            R$ ${Number(item.preco).toFixed(2)}
        </span>
        <br><br>
        <button onclick="adicionarAoCarrinho('${item._id}')" 
            ${!temEstoque ? 'disabled style="background:#ccc; cursor: not-allowed;"' : ''}>
            ${temEstoque ? '🛒 Adicionar ao Carrinho' : 'Indisponível'}
        </button>
    `;
    container.appendChild(card);
  });
}

// --- FUNÇÕES DO CARRINHO (GLOBAIS) ---

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
  if(confirm("Deseja limpar todo o carrinho?")) {
    carrinho = [];
    atualizarCarrinho();
  }
};

window.enviarPedido = function() {
  if (carrinho.length === 0) return alert("Seu carrinho está vazio!");
  
  let mensagem = `*Novo Pedido - Cleane Películas*%0A%0A`;
  carrinho.forEach(item => {
    mensagem += `• ${item.nome} - R$ ${Number(item.preco).toFixed(2)}%0A`;
  });
  
  mensagem += `%0A*Total: R$ ${totalSpan.textContent}*`;
  
  // Link do WhatsApp com a mensagem formatada
  window.open(`https://wa.me/5573991350755?text=${mensagem}`, '_blank');
};

function atualizarCarrinho() {
  if (!lista) return;
  lista.innerHTML = '';
  let total = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = '<p style="color: #999;">O carrinho está vazio.</p>';
  } else {
    carrinho.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.marginBottom = "5px";
      li.innerHTML = `
        <span>${item.nome} - R$ ${Number(item.preco).toFixed(2)}</span>
        <button onclick="removerDoCarrinho(${index})" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold;">[x]</button>
      `;
      lista.appendChild(li);
      total += Number(item.preco);
    });
  }
  
  totalSpan.textContent = total.toFixed(2);
}

// --- INICIALIZAÇÃO ---
document.getElementById("btnLogin")?.addEventListener("click", loginAdmin);
document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    alert("Você saiu do painel admin.");
    location.reload();
});

// Começa a buscar os produtos assim que a página carrega
buscarProdutosDaAPI();