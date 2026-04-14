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

// --- CONFIGURAÇÃO DO CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});

// Logs de verificação (ajudam a debugar no terminal)
console.log("--- Verificação de Configuração ---");
console.log("Cloudinary Cloud Name:", cloudinary.config().cloud_name || "NÃO CONFIGURADO");
console.log("Cloudinary API Key:", cloudinary.config().api_key ? "OK" : "Faltando");
console.log("Cloudinary API Secret:", cloudinary.config().api_secret ? "OK" : "Faltando");
console.log("MongoDB URI:", process.env.MONGO_URI ? "OK" : "Faltando");
console.log("-----------------------------------");

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- SEGURANÇA ---
const ADMIN_USER = {
  usuario: process.env.ADMIN_USER || "cleane",
  senha: process.env.ADMIN_PASS || "brasileira",
  role: "admin"
};

// --- FUNÇÃO AUXILIAR CLOUDINARY ---
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'cleanesite_produtos'
        // O SDK gera timestamp e assinatura automaticamente
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

// --- MIDDLEWARE DE PROTEÇÃO ---
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

app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ dataCriacao: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

app.post('/api/produtos', verificarAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, estoque } = req.body;
    let imagemUrl = "https://via.placeholder.com/150";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imagemUrl = result.secure_url;
    }

    const novo = new Produto({ 
      nome, 
      descricao, 
      preco: Number(preco), 
      estoque: Number(estoque), 
      imagemUrl 
    });
    
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    console.error("Erro ao salvar produto:", err);
    res.status(500).json({ erro: err.message || "Erro ao salvar" });
  }
});

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

app.delete('/api/produtos/:id', verificarAdmin, async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Removido!" });
  } catch (err) {
    console.error("Erro ao deletar produto:", err);
    res.status(500).json({ erro: err.message || "Erro ao deletar" });
  }
});

// --- SERVIR FRONTEND ---
app.use(express.static(path.join(__dirname, "frontend")));

// Rota catch-all para SPA (React/Vue/etc)
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`)))
  .catch(err => console.error("Erro crítico ao conectar no MongoDB:", err));