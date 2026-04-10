import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Produto } from './models/produto.js';
import { v2 as cloudinary } from 'cloudinary';
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO CLOUDINARY ---
// Prioriza variáveis de ambiente para segurança
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// --- CONFIGURAÇÃO DO MULTER (MEMORY STORAGE) ---
// No Render, salvar em pastas locais pode falhar. Usamos o buffer da memória.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- SEGURANÇA ---
const ADMIN_USER = {
  usuario: process.env.ADMIN_USER || "admin",
  senha: process.env.ADMIN_PASS || "senha123",
  role: "admin"
};

// --- FUNÇÃO AUXILIAR CLOUDINARY (STREAM UPLOAD) ---
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'cleanesite_produtos' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

// --- MIDDLEWARES DE PROTEÇÃO ---
function verificarAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ erro: "Acesso restrito." });

  try {
    const token = authHeader.split(" ")[1]; 
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_fallback");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ erro: "Sessão expirada." });
  }
}

// --- ROTAS DA API ---

// Login
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === ADMIN_USER.usuario && senha === ADMIN_USER.senha) {
    const token = jwt.sign(
      { usuario: ADMIN_USER.usuario, role: "admin" },
      process.env.JWT_SECRET || "segredo_fallback",
      { expiresIn: "8h" } 
    );
    return res.json({ token });
  }
  res.status(401).json({ erro: "Credenciais inválidas" });
});

// Listar
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ dataCriacao: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

//testar
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

// Criar (POST)
app.post('/api/produtos', verificarAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, estoque } = req.body;
    let imagemUrl = "https://via.placeholder.com/150";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imagemUrl = result.secure_url;
    }

    const novo = new Produto({ nome, descricao, preco: Number(preco), estoque: Number(estoque), imagemUrl });
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar" });
  }
});

// Editar (PUT)
app.put('/api/produtos/:id', verificarAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updates.imagemUrl = result.secure_url;
    }

    const editado = await Produto.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(editado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao editar" });
  }
});

// Excluir
app.delete('/api/produtos/:id', verificarAdmin, async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Removido!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`🚀 On na porta ${PORT}`)))
  .catch(err => console.error("Erro DB:", err));