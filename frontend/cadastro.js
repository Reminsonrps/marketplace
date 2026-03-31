const form = document.getElementById('cadastrar');
const corpoTabela = document.getElementById('corpo-tabela');
const btnSubmit = form.querySelector('input[type="submit"]');

let modoEdicao = false;
let idEdicao = null;

// 1. BUSCAR PRODUTOS
async function buscarProdutos() {
    try {
        const response = await fetch('http://localhost:3000/api/produtos');
        const produtos = await response.json();
        atualizarTabela(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
    }
}

// 2. ATUALIZAR TABELA (Adicionado ícone de editar)
let listaProdutosLocal = []; // Criamos uma cópia local para facilitar

function atualizarTabela(produtos) {
    listaProdutosLocal = produtos; // Guarda a lista vinda da API
    corpoTabela.innerHTML = "";

    produtos.forEach(p => {
        corpoTabela.innerHTML += `
            <tr>
                <td>${p._id.slice(-4)}</td>
                <td>${p.nome}</td>
                <td>${p.descricao}</td>
                <td>R$ ${Number(p.preco).toFixed(2)}</td>
                <td><img src="${p.imagemUrl}" width="50" style="border-radius: 4px;"></td>
                <td>
                    <button class="btn-acao" onclick="prepararEdicao('${p._id}')">
                        <span class="material-symbols-outlined" style="color: #2196f3;">edit</span>
                    </button>
                    <button class="btn-acao" onclick="excluirProduto('${p._id}')">
                        <span class="material-symbols-outlined" style="color: #ca0d5c;">delete</span>
                    </button>
                </td>
            </tr>
        `;
    });
}

// 3. PREPARAR EDIÇÃO (Melhorado)
window.prepararEdicao = (id) => {
    // Busca o produto na nossa lista local usando o ID
    const p = listaProdutosLocal.find(prod => prod._id === id);
    
    if (!p) return;

    modoEdicao = true;
    idEdicao = id;

    // Preenche os campos
    document.getElementById('nome').value = p.nome;
    document.getElementById('descricao').value = p.descricao;
    document.getElementById('preco').value = p.preco;
    document.getElementById('estoque').value = p.estoque || 0;

    // Muda o visual do botão
    btnSubmit.value = "Salvar Alterações";
    btnSubmit.style.background = "#2196f3";
    
    document.querySelector('aside').scrollIntoView({ behavior: 'smooth' });
};

// 3. PREPARAR EDIÇÃO (Preenche o formulário)
window.prepararEdicao = (id, nome, descricao, preco, estoque) => {
    modoEdicao = true;
    idEdicao = id;

    // Preenche os campos do formulário
    document.getElementById('nome').value = nome;
    document.getElementById('descricao').value = descricao;
    document.getElementById('preco').value = preco;
    document.getElementById('estoque').value = estoque;

    // Muda o visual do botão
    btnSubmit.value = "Salvar Alterações";
    btnSubmit.style.background = "#2196f3";
    
    // Rola a página para o formulário
    document.querySelector('aside').scrollIntoView({ behavior: 'smooth' });
};

// 4. EXCLUIR PRODUTO
window.excluirProduto = async (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            await fetch(`http://localhost:3000/api/produtos/${id}`, { method: 'DELETE' });
            buscarProdutos();
        } catch (error) {
            alert("Erro ao excluir.");
        }
    }
};

// 5. EVENTO DE SUBMIT (Cadastrar OU Editar)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

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
        let url = 'http://localhost:3000/api/produtos';
        let metodo = 'POST';

        // Se estiver editando, muda a URL e o Método (PUT)
        if (modoEdicao) {
            url = `http://localhost:3000/api/produtos/${idEdicao}`;
            metodo = 'PUT'; 
        }

        const response = await fetch(url, {
            method: metodo,
            body: formData
        });

        if (response.ok) {
            alert(modoEdicao ? "Produto atualizado!" : "Produto cadastrado!");
            
            // Reseta o estado do formulário
            modoEdicao = false;
            idEdicao = null;
            btnSubmit.value = "Cadastrar Produto";
            btnSubmit.style.background = "#ca0d5c";
            
            form.reset();
            buscarProdutos();
        }
    } catch (error) {
        console.error("Erro no envio:", error);
    }
});

buscarProdutos();