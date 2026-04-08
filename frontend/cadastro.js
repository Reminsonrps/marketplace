// 1. Configurações Iniciais
const API_URL = "https://cleane-peliculas.onrender.com"; 

const container = document.getElementById('cards'); // usado na página de catálogo
const corpoTabela = document.getElementById('corpo-tabela'); // usado na página de configuração
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');

let carrinho = [];
let todosOsProdutos = []; 

// --- GESTÃO DE TOKEN ---
let token = localStorage.getItem("token") || null;

// 2. LOGIN ADMIN (Simplificado)
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

    if (!response.ok) throw new Error("Credenciais inválidas");

    const data = await response.json();
    localStorage.setItem("token", data.token);
    alert("Bem-vinda, Cleane!");
    window.location.href = "cadastro.html"; 
  } catch (err) {
    alert("Erro ao acessar o painel.");
  }
}

// 3. BUSCAR PRODUTOS DA API
async function buscarProdutosDaAPI() {
  try {
    const response = await fetch(`${API_URL}/api/produtos`);


    if (!response.ok) throw new Error("Erro ao buscar dados");
    
    todosOsProdutos = await response.json();
    console.log("Produtos recebidos:", todosOsProdutos);

    // Decide automaticamente onde renderizar
    if (container) {
      renderizarCards(todosOsProdutos);
    } else if (corpoTabela) {
      renderizarTabela(todosOsProdutos);
    }
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    if (container) {
      container.innerHTML = `<p style="color: red; text-align: center; grid-column: 1/-1;">Servidor offline. Tente novamente em instantes.</p>`;
    }
    if (corpoTabela) {
      corpoTabela.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Servidor offline. Tente novamente em instantes.</td></tr>`;
    }
  }
}

// 4. LÓGICA DO FILTRO (apenas catálogo)
campoBusca?.addEventListener('input', () => {
  const termo = campoBusca.value.toLowerCase().trim();
  const produtosFiltrados = todosOsProdutos.filter(p => 
    (p.nome?.toLowerCase() || '').includes(termo) || 
    (p.descricao?.toLowerCase() || '').includes(termo)
  );
  renderizarCards(produtosFiltrados);
});

// 5A. RENDERIZAR CARDS (catálogo)
function renderizarCards(listaProdutos) {
  if (!container) return;
  container.innerHTML = '';
  
  if (listaProdutos.length === 0) {
    container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: #999;">Nenhuma película encontrada. 🌸</p>`;
    return;
  }

  listaProdutos.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    const temEstoque = item.estoque > 0;

    card.innerHTML = `
        <img src="${item.imagemUrl || item.imagem || ''}" alt="${item.nome}">
        <div class="card-info">
            <h3>${item.nome}</h3>
            <p>${item.descricao}</p>
            <span class="status-estoque" style="color: ${temEstoque ? '#28a745' : '#dc3545'};">
                ${temEstoque ? item.estoque + ' em estoque' : 'Esgotado'}
            </span>
            <span class="preco">R$ ${Number(item.preco).toFixed(2)}</span>
        </div>
        <button onclick="adicionarAoCarrinho('${item._id}')"
            ${!temEstoque ? 'disabled class="btn-indisponivel"' : ''}>
            ${temEstoque ? '🛒 Adicionar' : 'Indisponível'}
        </button>
    `;
    container.appendChild(card);
  });
}

// 5B. RENDERIZAR TABELA (configuração)
function renderizarTabela(listaProdutos) {
  if (!corpoTabela) return;
  corpoTabela.innerHTML = '';

  if (!listaProdutos || listaProdutos.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  listaProdutos.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item._id}</td>
      <td>${item.nome}</td>
      <td>${item.descricao}</td>
      <td>R$ ${(Number(item.preco) || 0).toFixed(2)}</td>
      <td><img src="${item.imagemUrl || item.imagem || ''}" alt="${item.nome}" style="max-width:60px;"></td>
      <td>
        <button class="btn-acao" onclick="editarProduto('${item._id}')">✏️</button>
        <button class="btn-acao" onclick="removerProduto('${item._id}')">🗑️</button>
      </td>
    `;
    corpoTabela.appendChild(tr);
  });
}

// --- FUNÇÕES DO CARRINHO (apenas catálogo) ---
window.adicionarAoCarrinho = function(id) {
  const produto = todosOsProdutos.find(p => p._id === id);
  if (produto && produto.estoque > 0) {
    carrinho.push(produto);
    atualizarCarrinho();
    alert(`${produto.nome} adicionado!`);
  }
};

window.removerDoCarrinho = function(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
};

window.limparCarrinho = function() {
  if(confirm("Limpar carrinho?")) {
    carrinho = [];
    atualizarCarrinho();
  }
};

window.enviarPedido = function() {
  if (carrinho.length === 0) return alert("Carrinho vazio!");
  
  let mensagem = `*Pedido - Cleane Películas*%0A%0A`;
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

  if (carrinho.length === 0) {
    lista.innerHTML = '<p style="color: #999;">O carrinho está vazio.</p>';
  } else {
    carrinho.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = "item-carrinho";
      li.innerHTML = `
        <span>${item.nome}</span>
        <div>
            <span>R$ ${Number(item.preco).toFixed(2)}</span>
            <button onclick="removerDoCarrinho(${index})">❌</button>
        </div>
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
    location.reload();
});

buscarProdutosDaAPI();