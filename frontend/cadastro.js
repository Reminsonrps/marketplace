// 1. Configurações Iniciais
const API_URL = "https://cleane-peliculas.onrender.com"; 

const container = document.getElementById('cards'); 
const corpoTabela = document.getElementById('corpo-tabela'); 
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');

let carrinho = [];
let todosOsProdutos = []; 

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

    if (!response.ok) throw new Error("Credenciais inválidas");

    const data = await response.json();
    localStorage.setItem("token", data.token);
    alert("Bem-vinda, Cleane!");
    window.location.href = "cadastro.html"; 
  } catch (err) {
    alert("Erro ao acessar o painel.");
  }
}

// 3. BUSCAR PRODUTOS
async function buscarProdutosDaAPI() {
  try {
    const response = await fetch(`${API_URL}/api/produtos`);
    if (!response.ok) throw new Error("Erro ao buscar dados");
    
    todosOsProdutos = await response.json();
    console.log("Produtos recebidos:", todosOsProdutos);

    if (container) {
      renderizarCards(todosOsProdutos);
    } else if (corpoTabela) {
      renderizarTabela(todosOsProdutos);
    }
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
  }
}

// 4. CRUD DE PRODUTOS
async function criarProduto(formData) {
  try {
    const response = await fetch(`${API_URL}/api/produtos`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Erro ao cadastrar produto");
    }

    alert("Produto cadastrado com sucesso!");
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao salvar produto: " + err.message);
  }
}

async function editarProduto(id) {
  const produto = todosOsProdutos.find(p => p._id === id);
  if (!produto) return alert("Produto não encontrado");

  // Preenche o formulário com os dados atuais
  document.getElementById("nome").value = produto.nome;
  document.getElementById("descricao").value = produto.descricao;
  document.getElementById("preco").value = produto.preco;
  document.getElementById("estoque").value = produto.estoque;

  const btn = document.querySelector("#cadastrar input[type=submit]");
  btn.value = "Salvar Alterações";

  const form = document.getElementById("cadastrar");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch(`${API_URL}/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Erro ao editar produto");
      }

      alert("Produto atualizado com sucesso!");
      form.reset();
      btn.value = "Cadastrar Produto"; // volta ao modo cadastro
      buscarProdutosDaAPI();
    } catch (err) {
      alert("Erro ao editar: " + err.message);
    }
  };
}

async function removerProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;
  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || "Erro ao excluir produto");
    }

    alert("Produto removido!");
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao excluir: " + err.message);
  }
}

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

// --- INICIALIZAÇÃO ---
document.getElementById("btnLogin")?.addEventListener("click", loginAdmin);
document.getElementById("btnLogout")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  location.reload();
});

// Captura envio do formulário de cadastro
document.getElementById("cadastrar")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  await criarProduto(formData);
  form.reset();
});

buscarProdutosDaAPI();