// 1. Configurações Iniciais
const API_URL = "https://cleane-peliculas.onrender.com"; 

const container = document.getElementById('cards'); 
const corpoTabela = document.getElementById('corpo-tabela'); 
const campoBusca = document.getElementById('campoBusca');
const lista = document.getElementById('lista-carrinho');
const totalSpan = document.getElementById('total');

let carrinho = [];
let todosOsProdutos = []; 
let token = localStorage.getItem("token") || null;
let editandoId = null; // controla se estamos editando ou cadastrando

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

    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Credenciais inválidas");

    localStorage.setItem("token", data.token);
    alert("Bem-vinda, Cleane!");
    window.location.href = "cadastro.html"; 
  } catch (err) {
    alert("Erro ao acessar o painel: " + err.message);
  }
}

// 3. BUSCAR PRODUTOS
async function buscarProdutosDaAPI() {
  try {
    const response = await fetch(`${API_URL}/api/produtos`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Erro ao buscar dados");

    todosOsProdutos = data;
    if (container) renderizarCards(todosOsProdutos);
    else if (corpoTabela) renderizarTabela(todosOsProdutos);
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
  }
}

// 4. CRUD DE PRODUTOS
async function salvarProduto(formData) {
  try {
    const url = editandoId ? `${API_URL}/api/produtos/${editandoId}` : `${API_URL}/api/produtos`;
    const method = editandoId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    const text = await response.text(); // captura como texto cru
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { erro: text };
    }

    if (!response.ok) {
      console.error("Erro detalhado do servidor:", data);
      throw new Error(data.erro || `Erro HTTP ${response.status}`);
    }

    alert(editandoId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
    document.getElementById("cadastrar").reset();
    document.querySelector("#cadastrar input[type=submit]").value = "Cadastrar Produto";
    editandoId = null;
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao salvar produto: " + err.message);
  }
}

function editarProduto(id) {
  const produto = todosOsProdutos.find(p => p._id === id);
  if (!produto) return alert("Produto não encontrado");

  document.getElementById("nome").value = produto.nome;
  document.getElementById("descricao").value = produto.descricao;
  document.getElementById("preco").value = produto.preco;
  document.getElementById("estoque").value = produto.estoque;

  document.querySelector("#cadastrar input[type=submit]").value = "Salvar Alterações";
  editandoId = id;
}

async function removerProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;
  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { erro: text };
    }

    if (!response.ok) {
      console.error("Erro detalhado do servidor:", data);
      throw new Error(data.erro || `Erro HTTP ${response.status}`);
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

// Captura envio do formulário
document.getElementById("cadastrar")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  await salvarProduto(formData);
});

buscarProdutosDaAPI();