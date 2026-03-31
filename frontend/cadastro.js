// 1. CONFIGURAÇÕES INICIAIS
const API_URL = "https://cleane-peliculas.onrender.com"; // ALTERE para o link do Railway quando fizer o deploy

const form = document.getElementById('cadastrar');
const corpoTabela = document.getElementById('corpo-tabela');
const btnSubmit = form.querySelector('input[type="submit"]');

let modoEdicao = false;
let idEdicao = null;
let listaProdutosLocal = [];

// VERIFICAÇÃO DE ACESSO
const token = localStorage.getItem("token");
if (!token) {
    alert("⚠️ Acesso restrito: apenas administradores podem usar esta página.");
    window.location.href = "index.html"; 
}

// 2. BUSCAR PRODUTOS (Com Token de Autenticação)
async function buscarProdutos() {
    try {
        // Buscamos o token que foi salvo no login
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/api/produtos`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`, // <-- ESSENCIAL para o servidor aceitar
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("Sessão expirada. Por favor, faça login novamente.");
                window.location.href = "index.html";
                return;
            }
            throw new Error("Falha ao buscar produtos");
        }
        
        const produtos = await response.json();
        atualizarTabela(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        // Se cair aqui, o servidor provavelmente está 'dormindo' (plano gratuito do Render)
    }
}

// 3. ATUALIZAR TABELA NA TELA
function atualizarTabela(produtos) {
    listaProdutosLocal = produtos;
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p._id.slice(-4)}</td>
            <td><strong>${p.nome}</strong></td>
            <td>${p.descricao}</td>
            <td>R$ ${Number(p.preco).toFixed(2)}</td>
            <td><img src="${p.imagemUrl}" width="50" style="border-radius: 4px; border: 1px solid #ddd;"></td>
            <td>
                <button class="btn-acao" onclick="prepararEdicao('${p._id}')" title="Editar">
                    <span class="material-symbols-outlined" style="color: #2196f3; cursor:pointer;">edit</span>
                </button>
                <button class="btn-acao" onclick="excluirProduto('${p._id}')" title="Excluir">
                    <span class="material-symbols-outlined" style="color: #ca0d5c; cursor:pointer;">delete</span>
                </button>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// 4. PREPARAR EDIÇÃO (Puxa os dados para o form)
window.prepararEdicao = (id) => {
    const p = listaProdutosLocal.find(prod => prod._id === id);
    if (!p) return;

    modoEdicao = true;
    idEdicao = id;

    // Preenche os campos do formulário
    document.getElementById('nome').value = p.nome;
    document.getElementById('descricao').value = p.descricao;
    document.getElementById('preco').value = p.preco;
    document.getElementById('estoque').value = p.estoque || 0;

    // Muda o visual do botão
    btnSubmit.value = "Salvar Alterações";
    btnSubmit.style.background = "#2196f3";

    // Rola a tela para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 5. EXCLUIR PRODUTO
window.excluirProduto = async (id) => {
    if (confirm("Deseja realmente apagar esta película do catálogo?")) {
        try {
            const response = await fetch(`${API_URL}/api/produtos/${id}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert("Produto removido!");
                buscarProdutos(); // Atualiza a tabela
            } else {
                alert("Erro ao excluir. Verifique se sua sessão não expirou.");
            }
        } catch (error) {
            console.error("Erro na exclusão:", error);
            alert("Erro de conexão com o servidor.");
        }
    }
};

// 6. EVENTO DE SUBMIT (Cadastrar OU Editar)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mostra um "Carregando" no botão
    const textoOriginal = btnSubmit.value;
    btnSubmit.value = "Enviando...";
    btnSubmit.disabled = true;

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('descricao', document.getElementById('descricao').value);
    formData.append('preco', document.getElementById('preco').value);
    formData.append('estoque', document.getElementById('estoque').value || 0);

    const imagemFile = document.getElementById('imagem').files[0];
    if (imagemFile) {
        formData.append('imagem', imagemFile);
    }

    try {
        let url = `${API_URL}/api/produtos`;
        let metodo = 'POST';

        if (modoEdicao) {
            url = `${API_URL}/api/produtos/${idEdicao}`;
            metodo = 'PUT'; // O backend já está preparado para PUT
        }

        const response = await fetch(url, {
            method: metodo,
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData // Não definimos Content-Type aqui, o navegador faz isso para o FormData
        });

        if (response.ok) {
            alert(modoEdicao ? "✅ Película atualizada com sucesso!" : "✅ Nova película cadastrada!");
            
            // Reset do estado
            modoEdicao = false;
            idEdicao = null;
            btnSubmit.value = "Cadastrar Produto";
            btnSubmit.style.background = "#ca0d5c";
            form.reset();
            buscarProdutos();
        } else {
            const erro = await response.json();
            alert(`Erro: ${erro.erro || "Ação não autorizada"}`);
        }
    } catch (error) {
        console.error("Erro no envio:", error);
        alert("Erro de conexão. O servidor está rodando?");
    } finally {
        btnSubmit.disabled = false;
        if (!modoEdicao) btnSubmit.value = "Cadastrar Produto";
    }
});

// Inicializa a tabela ao abrir a página
buscarProdutos();
