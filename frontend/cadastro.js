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

// 4. CRUD DE PRODUTOS (cadastro.html)
async function criarProduto(formData) {
  try {
    const response = await fetch(`${API_URL}/api/produtos`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error("Erro ao criar produto");
    alert("Produto criado com sucesso!");
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao salvar produto: " + err.message);
  }
}

async function editarProduto(id) {
  const nome = prompt("Novo nome:");
  const descricao = prompt("Nova descrição:");
  const preco = prompt("Novo preço:");
  const estoque = prompt("Novo estoque:");

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("descricao", descricao);
  formData.append("preco", preco);
  formData.append("estoque", estoque);

  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error("Erro ao editar produto");
    alert("Produto atualizado!");
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao editar: " + err.message);
  }
}

async function removerProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;
  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Erro ao excluir produto");
    alert("Produto removido!");
    buscarProdutosDaAPI();
  } catch (err) {
    alert("Erro ao excluir: " + err.message);
  }
}

// --- INICIALIZAÇÃO ---
document.getElementById("btnLogin")?.addEventListener("click", loginAdmin);
document.getElementById("btnLogout")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  location.reload();
});

buscarProdutosDaAPI();