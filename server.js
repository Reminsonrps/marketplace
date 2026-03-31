import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';
import { Produto } from './models/produto.js';
import { v2 as cloudinary } from 'cloudinary';
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARES ESSENCIAIS ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO CLOUDINARY ---
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvunnmetj', 
  api_key: process.env.CLOUDINARY_API_KEY || '122137693514899', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'tIOAPXNLtRRDxiuyKyDXUbt7DzE' 
});

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
    cb(null, dir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- SEGURANÇA (ADMIN) ---
const ADMIN_USER = {
  usuario: process.env.ADMIN_USER || "cleaneadmin",
  senha: process.env.ADMIN_PASS || "brasileira",
  role: "admin"
};

// --- ROTA DE LOGIN ---
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === ADMIN_USER.usuario && senha === ADMIN_USER.senha) {
    const token = jwt.sign(
      { usuario: ADMIN_USER.usuario, role: ADMIN_USER.role },
      process.env.JWT_SECRET || "segredo_super_secreto",
      { expiresIn: "4h" } 
    );
    return res.json({ token });
  } else {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }
});

// --- MIDDLEWARE DE PROTEÇÃO ---
function verificarAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ erro: "Acesso restrito. Faça login." });

  try {
    const token = authHeader.split(" ")[1]; 
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_super_secreto");

    if (decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ erro: "Acesso negado" });
    }
  } catch (err) {
    res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
  }
}

// --- ROTAS DA API ---

// 1. Listar Produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ dataCriacao: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

// 2. Cadastrar Produto (POST)
app.post('/api/produtos', verificarAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, estoque } = req.body;
    let imagemUrl = "https://via.placeholder.com/150"; 

    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cleanesite_produtos'
      });
      imagemUrl = resultado.secure_url;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
    }

    const novoProduto = new Produto({
      nome,
      descricao,
      preco: Number(preco) || 0,
      categoria,
      estoque: Number(estoque) || 0, 
      imagemUrl
    });

    await novoProduto.save();
    res.status(201).json(novoProduto);
  } catch (err) {
    console.error("Erro ao salvar:", err);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});

// 3. Atualizar Produto (PUT) - ADICIONADO PARA FUNCIONAR O EDITAR
app.put('/api/produtos/:id', verificarAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, estoque } = req.body;
    let dadosParaAtualizar = {
      nome,
      descricao,
      preco: Number(preco) || 0,
      categoria,
      estoque: Number(estoque) || 0
    };

    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cleanesite_produtos'
      });
      dadosParaAtualizar.imagemUrl = resultado.secure_url;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const produtoAtualizado = await Produto.findByIdAndUpdate(
      req.params.id, 
      dadosParaAtualizar, 
      { new: true }
    );

    if (!produtoAtualizado) return res.status(404).json({ erro: "Produto não encontrado" });
    
    res.json(produtoAtualizado);
  } catch (err) {
    console.error("Erro ao atualizar:", err);
    res.status(500).json({ erro: "Erro ao editar produto" });
  }
});

// 4. Excluir Produto (DELETE)
app.delete('/api/produtos/:id', verificarAdmin, async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Produto removido com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

// --- SERVIR FRONTEND ---
app.use(express.static(path.join(__dirname, 'frontend')));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// --- CONEXÃO E INICIALIZAÇÃO ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleanesite';
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));
  })
  .catch(err => console.error("❌ Erro no MongoDB:", err));