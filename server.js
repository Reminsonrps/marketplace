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

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO CLOUDINARY ---
cloudinary.config({ 
  cloud_name: 'dvunnmetj', 
  api_key: '122137693514899', 
  api_secret: 'tIOAPXNLtRRDxiuyKyDXUbt7DzE' 
});

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Cria a pasta se não existir
    cb(null, dir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, './frontend')));

// --- ROTAS ---

// CADASTRAR (POST)
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, estoque } = req.body;
    let imagemUrl = "https://via.placeholder.com/150"; 

    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cleanesite_produtos'
      });
      imagemUrl = resultado.secure_url;
      fs.unlinkSync(req.file.path); 
    }

    const novoDoc = new Produto({
      nome,
      descricao,
      preco: Number(preco) || 0,
      categoria,
      estoque: Number(estoque) || 0, 
      imagemUrl
    });

    await novoDoc.save();
    res.status(201).json(novoDoc);
  } catch (err) {
    console.error("Erro ao salvar:", err);
    res.status(500).json({ erro: "Erro interno no servidor ou Cloudinary" });
  }
});

// LISTAR (GET)
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ dataCriacao: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar" });
  }
});

// EXCLUIR (DELETE)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Removido!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

// EDITAR (PUT)
app.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, estoque } = req.body;
    const updateData = { 
      nome, 
      descricao, 
      preco: Number(preco), 
      categoria, 
      estoque: Number(estoque) 
    };

    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cleanesite_produtos'
      });
      updateData.imagemUrl = resultado.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const produtoAtualizado = await Produto.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );

    res.json(produtoAtualizado);
  } catch (err) {
    console.error("Erro ao editar:", err);
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});

// SERVIR O FRONT-END
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend', 'cadastro.html'));
}); // <--- CHAVE FECHADA AQUI CORRETAMENTE

// --- CONEXÃO ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleanesite';
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor e Cloudinary ativos: http://localhost:${PORT}`));
  })
  .catch(err => console.error("❌ Erro no MongoDB:", err));