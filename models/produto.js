import mongoose from 'mongoose';

const produtoSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: [true, "O nome do produto é obrigatório"],
    trim: true // Remove espaços vazios acidentais no início/fim
  },
  preco: { 
    type: Number, 
    required: [true, "O preço é obrigatório"],
    min: [0, "O preço não pode ser negativo"]
  },
  categoria: { 
    type: String, 
    default: "Geral" 
  },
  // Mudança estratégica: Guardamos a URL (link) da imagem
  imagemUrl: { 
    type: String, 
    required: false,
    default: "https://via.placeholder.com/150" // Uma imagem padrão caso não subam nenhuma
  },
  // Alinhado com o seu <textarea id="descricao"> do HTML
  descricao: { 
    type: String, 
    required: [true, "A descrição é obrigatória"] 
  },
  estoque: { 
    type: Number, 
    default: 0 
  },
  dataCriacao: { 
    type: Date, 
    default: Date.now 
  }
});

// Criando o modelo
export const Produto = mongoose.model('Produto', produtoSchema);