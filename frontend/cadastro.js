// 1. CONFIGURAÇÕES INICIAIS
const API_URL = "https://cleane-peliculas.onrender.com"; 

const form = document.getElementById('cadastrar');
const corpoTabela = document.getElementById('corpo-tabela');
const btnSubmit = form.querySelector('input[type="submit"]');

let modoEdicao = false;
let idEdicao = null;
let listaProdutosLocal = [];

// 2. BUSCAR PRODUTOS
async function buscarProdutos() {
    const token = localStorage.getItem("token");

    // Redireciona se não tiver token
    if (!token) {
        alert("Acesso restrito. Faça login.");
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/produtos`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
                localStorage.removeItem("token");
                window.location.href = "index.html";
                return;
            }
            throw new Error("Erro ao buscar dados");
        }
        
        const produtos = await response.json();
        atualizarTabela(produtos);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

// 3. ATUALIZAR TABELA
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
            <td><img src="${p.imagemUrl}" width="50" style="border-radius: 4px;"></td>
            <td>
                <button onclick="prepararEdicao('${p._id}')" class="btn-acao">Editar</button>
                <button onclick="excluirProduto('${p._id}')" class="btn-acao">Excluir</button>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// 4. PREPARAR EDIÇÃO
window.prepararEdicao = (id) => {
    const p = listaProdutosLocal.find(prod => prod._id === id);
    if (!p) return;

    modoEdicao = true;
    idEdicao = id;

    document.getElementById('nome').value = p.nome;
    document.getElementById('descricao').value = p.descricao;
    document.getElementById('preco').value = p.preco;
    document.getElementById('estoque').value = p.estoque || 0;

    btnSubmit.value = "Salvar Alterações";
    btnSubmit.style.background = "#2196f3";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 5. EVENTO DE SUBMIT
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tokenAtual = localStorage.getItem("token");
    btnSubmit.value = "Enviando...";
    btnSubmit.disabled = true;

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('descricao', document.getElementById('descricao').value);
    formData.append('preco', document.getElementById('preco').value);
    formData.append('estoque', document.getElementById('estoque').value || 0);

    const imagemInput = document.getElementById('imagem');
    if (imagemInput.files[0]) {
        formData.append('imagem', imagemInput.files[0]);
    }

    try {
        let url = `${API_URL}/api/produtos`;
        let metodo = 'POST';

        if (modoEdicao && idEdicao) {
            url = `${API_URL}/api/produtos/${idEdicao}`;
            metodo = 'PUT';
        }

        const response = await fetch(url, {
            method: metodo,
            headers: {
                "Authorization": `Bearer ${tokenAtual}`
                // Não defina Content-Type aqui para FormData!
            },
            body: formData 
        });

        const contentType = response.headers.get("content-type");
        
        if (response.ok) {
            alert(modoEdicao ? "✅ Atualizado com sucesso!" : "✅ Cadastrado com sucesso!");
            location.reload();
        } else {
            if (contentType && contentType.includes("application/json")) {
                const erroData = await response.json();
                alert(`Erro: ${erroData.erro}`);
            } else {
                alert(`Erro Crítico: O servidor retornou erro ${response.status}.`);
            }
        }

    } catch (error) {
        console.error("Erro fatal:", error);
        alert("Erro de conexão. Verifique se o servidor está online.");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.value = modoEdicao ? "Salvar Alterações" : "Cadastrar Produto";
    }
});

// Inicialização
buscarProdutos();