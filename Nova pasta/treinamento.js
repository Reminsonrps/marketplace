// Selecione um elemento fixo para o valor total no seu HTML
// Ex: <div id="valor-final">Total: R$ 0.00</div>
const elementoSoma = document.querySelector("#valor-final") || document.createElement("div");

botaoComprar.addEventListener("click", () => {
  // 1. Criar o elemento do item no carrinho
  const produtoNoCarrinho = document.createElement("div");
  produtoNoCarrinho.classList.add("item-carrinho");
  produtoNoCarrinho.innerHTML = `
    <span>${item.nome} - R$ ${item.preco.toFixed(2)}</span>
    <button class="btn-remover-item" style="margin-left: 10px; color: red;">X</button>
  `;

  // 2. Lógica de remover o item (criada no momento em que o item nasce)
  const botaoRemover = produtoNoCarrinho.querySelector(".btn-remover-item");
  botaoRemover.addEventListener("click", () => {
    produtoNoCarrinho.remove(); // Remove do HTML
    soma -= item.preco;         // Subtrai do total
    atualizarTotal();           // Atualiza a tela
    alert("Produto removido!");
  });

  // 3. Adicionar ao container e atualizar soma
  total.appendChild(produtoNoCarrinho);
  soma += item.preco;
  atualizarTotal();
  alert("Produto adicionado!");
});

// Função auxiliar para manter o código limpo
function atualizarTotal() {
  elementoSoma.innerHTML = `<strong>Soma total: R$ ${soma.toFixed(2)}</strong>`;
  if (!elementoSoma.parentElement) total.after(elementoSoma);
}