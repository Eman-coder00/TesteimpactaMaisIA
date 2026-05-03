require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoStore } = require('connect-mongo');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        const { db, client } = await connectDB();
        console.log('--- MONGODB CONECTADO ---');

        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));
        app.set('trust proxy', 1); // Necessário para Render/Proxies (sessions/secure cookies)

        // SEGURANÇA: Cabeçalhos HTTP (CSP, HSTS, etc)
        app.use(helmet({
            contentSecurityPolicy: false, // Desativado para facilitar carregamento de imagens externas/lucide por enquanto
            crossOriginEmbedderPolicy: false
        }));

        app.use(express.urlencoded({ extended: true, limit: '2mb' }));
        app.use(express.json({ limit: '2mb' }));
        app.use(express.static(path.join(__dirname, 'public')));

        // CONFIGURAÇÃO DE SESSÃO
        app.use(session({
            name: 'IMPACTA_SESSION_ID',
            secret: process.env.SESSION_SECRET || 'chave_mestra_impacta_2026',
            resave: true, 
            saveUninitialized: true,
            store: MongoStore.create({
                mongoUrl: process.env.MONGODB_URI,
                dbName: process.env.MONGODB_DB || 'cesmac_blog',
                collectionName: 'sessions',
                ttl: 24 * 60 * 60 // 1 dia
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24, // 1 dia
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // true para produção (HTTPS)
                sameSite: 'lax'
            }
        }));

        // MONITOR DE COOKIES (DEBUG)
        // MIDDLEWARE GLOBAL DE USUÁRIO E NOTIFICAÇÕES
        app.use(async (req, res, next) => {
            res.locals.user = null;
            res.locals.notifications = [];
            res.locals.unreadCount = 0;

            if (req.session.user) {
                try {
                    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
                    if (userDoc) {
                        res.locals.user = userDoc;
                        res.locals.notifications = userDoc.notifications?.reverse() || [];
                        res.locals.unreadCount = res.locals.notifications.filter(n => !n.read).length;
                    }
                } catch (error) {
                    console.error('Erro no middleware de usuário:', error);
                }
            }
            next();
        });

        // CONFIGURAÇÃO DO NODEMAILER (Para envio de e-mails)
        // O usuário deve configurar estas variáveis no .env para funcionar em produção
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER || 'placeholder@example.com',
                pass: process.env.EMAIL_PASS || 'password_placeholder'
            }
        });

        // --- ROTAS ---
        app.get('/', async (req, res) => {
            try {
                const sort = req.query.sort || 'latest';
                const category = req.query.category || 'Todos';
                
                let posts;
                const filter = category !== 'Todos' ? { category } : {};

                if (sort === 'likes') {
                    // Ordenar por número de curtidas usando agregação com filtro
                    posts = await db.collection('posts').aggregate([
                        { $match: filter },
                        {
                            $addFields: {
                                likesCount: { $size: { $ifNull: ["$likes", []] } }
                            }
                        },
                        { $sort: { likesCount: -1, createdAt: -1 } }
                    ]).toArray();
                } else {
                    // Ordenar por mais recentes (padrão) com filtro
                    posts = await db.collection('posts').find(filter).sort({ createdAt: -1 }).toArray();
                }

                const events = await db.collection('events').find().limit(3).toArray();
                res.render('index', { 
                    posts, 
                    events, 
                    currentSort: sort,
                    currentCategory: category
                });
            } catch (error) {
                console.error('Erro ao carregar home:', error);
                res.render('index', { 
                    posts: [], 
                    events: [], 
                    currentSort: 'latest',
                    currentCategory: 'Todos'
                });
            }
        });

        app.get('/login', (req, res) => res.render('login', { error: null }));
        app.get('/cadastro', (req, res) => res.render('cadastro', { error: null }));
        app.get('/eventos', async (req, res) => {
            const events = await db.collection('events').find().toArray();
            res.render('eventos', { events });
        });

        app.get('/perfil', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            const userId = new ObjectId(req.session.user.id);
            
            const userDoc = await db.collection('users').findOne({ _id: userId });
            const eventIds = userDoc.eventsJoined || [];
            const joinedEvents = await db.collection('events').find({ _id: { $in: eventIds } }).toArray();
            
            // Projetos e Eventos criados pelo usuário
            const myProjects = await db.collection('posts').find({ authorId: userId }).toArray();
            const myEvents = await db.collection('events').find({ authorId: userId }).toArray();

            // Buscar dados completos dos amigos (nome e foto)
            const friendIds = userDoc.friends || [];
            const friendsList = await db.collection('users').find(
                { _id: { $in: friendIds } },
                { projection: { name: 1, profilePic: 1 } }
            ).toArray();
            
            res.render('perfil', { user: userDoc, joinedEvents, myProjects, myEvents, friendsList });
        });

        app.get('/usuario/:id', async (req, res) => {
            try {
                const targetId = new ObjectId(req.params.id);
                if (req.session.user && req.session.user.id === req.params.id) {
                    return res.redirect('/perfil');
                }

                const userDoc = await db.collection('users').findOne({ _id: targetId });
                if (!userDoc) return res.redirect('/');

                const eventIds = userDoc.eventsJoined || [];
                const joinedEvents = await db.collection('events').find({ _id: { $in: eventIds } }).toArray();
                const myProjects = await db.collection('posts').find({ authorId: targetId }).toArray();
                const myEvents = await db.collection('events').find({ authorId: targetId }).toArray();

                let friendshipStatus = 'none'; // none, pending, friends
                if (req.session.user) {
                    const me = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
                    if (me.friends?.some(fId => fId.toString() === targetId.toString())) {
                        friendshipStatus = 'friends';
                    } else if (userDoc.friendRequests?.some(req => req.fromId.toString() === me._id.toString())) {
                        friendshipStatus = 'pending';
                    }
                }

                res.render('usuario-perfil', { 
                    targetUser: userDoc, 
                    joinedEvents, 
                    myProjects, 
                    myEvents,
                    friendshipStatus
                });
            } catch (error) {
                console.error('Erro ao carregar perfil público:', error);
                res.redirect('/');
            }
        });

        app.get('/evento', async (req, res) => {
            const id = req.query.id;
            if (!id) return res.redirect('/eventos');
            try {
                const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
                if (!event) return res.redirect('/eventos');

                // Buscar dados do autor
                const author = await db.collection('users').findOne(
                    { _id: event.authorId },
                    { projection: { name: 1, profilePic: 1 } }
                );
                
                let isParticipating = false;
                if (req.session.user) {
                    const u = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
                    isParticipating = u.eventsJoined?.some(eid => eid.toString() === id) || false;
                }
                
                // Contagem de participantes
                const participantsCount = event.participants ? event.participants.length : 0;
                
                res.render('evento-detalhe', { event, isParticipating, participantsCount, author });
            } catch (error) {
                res.redirect('/eventos');
            }
        });

        app.get('/projeto', async (req, res) => {
            const id = req.query.id;
            if (!id) return res.redirect('/');
            try {
                // Tenta buscar por slug primeiro, depois por ID
                let post = await db.collection('posts').findOne({ slug: id });
                if (!post && ObjectId.isValid(id)) {
                    post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
                }
                
                if (!post) return res.redirect('/');

                // Buscar dados do autor
                const author = await db.collection('users').findOne(
                    { _id: post.authorId },
                    { projection: { name: 1, profilePic: 1 } }
                );

                res.render('projeto', { post, author });
            } catch (error) {
                res.redirect('/');
            }
        });

        app.get('/projeto/novo', (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            res.render('novo-projeto', { error: null });
        });

        app.post('/projeto/novo', async (req, res) => {
            if (!req.session.user) return res.status(401).send('Não autorizado');
            
            const { title, category, description, longDescription, impact, volunteers, image } = req.body;
            
            if (!title || !category || !description || !longDescription || !impact || !volunteers || !image) {
                return res.render('novo-projeto', { error: 'Por favor, preencha todos os campos, incluindo a imagem de capa.' });
            }
            
            try {
                // Gerar slug a partir do título
                const slug = title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
                    .replace(/[^a-z0-9]+/g, '-') // Substitui não-alfanuméricos por hifen
                    .replace(/(^-|-$)+/g, ''); // Remove hifens no início/fim
                
                // Verificar se o slug já existe
                const existing = await db.collection('posts').findOne({ slug });
                const uniqueSlug = existing ? `${slug}-${Date.now()}` : slug;

                const newPost = {
                    title,
                    slug: uniqueSlug,
                    category,
                    description,
                    longDescription,
                    impact,
                    volunteers,
                    image, // Base64 otimizado enviado pelo cliente
                    authorId: new ObjectId(req.session.user.id),
                    authorName: req.session.user.name,
                    likes: [],
                    comments: [],
                    status: 'Ativo',
                    createdAt: new Date()
                };

                await db.collection('posts').insertOne(newPost);
                res.redirect(`/projeto?id=${uniqueSlug}`);
            } catch (error) {
                console.error('Erro ao criar projeto:', error);
                res.render('novo-projeto', { error: 'Erro ao salvar projeto. Tente novamente.' });
            }
        });

        app.get('/evento/novo', (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            res.render('novo-evento', { error: null });
        });

        app.post('/evento/novo', async (req, res) => {
            if (!req.session.user) return res.status(401).send('Não autorizado');
            
            const { title, category, description, longDescription, date, time, location } = req.body;
            
            if (!title || !category || !description || !longDescription || !date || !time || !location) {
                return res.render('novo-evento', { error: 'Por favor, preencha todos os campos obrigatórios.' });
            }
            
            try {
                const newEvent = {
                    title,
                    category,
                    description,
                    longDescription,
                    date,
                    time,
                    location,
                    authorId: new ObjectId(req.session.user.id),
                    authorName: req.session.user.name,
                    createdAt: new Date()
                };

                await db.collection('events').insertOne(newEvent);
                res.redirect('/eventos');
            } catch (error) {
                console.error('Erro ao criar evento:', error);
                res.render('novo-evento', { error: 'Erro ao salvar evento. Tente novamente.' });
            }
        });

        app.post('/login', async (req, res) => {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.render('login', { error: 'E-mail e senha são obrigatórios.' });
            }
            try {
                const userDoc = await db.collection('users').findOne({ email });
                
                if (userDoc && await bcrypt.compare(password, userDoc.password)) {
                    req.session.user = { id: userDoc._id.toString(), name: userDoc.name, email: userDoc.email };
                    
                    return req.session.save((err) => {
                        if (err) {
                            console.error('[AUTH] Erro ao salvar sessão:', err);
                            return res.render('login', { error: 'Erro interno ao salvar sessão.' });
                        }
                        console.log(`[AUTH] Login com sucesso para: ${email}`);
                        res.redirect('/');
                    });
                }
                
                console.log(`[AUTH] Falha de login para: ${email}`);
                res.render('login', { error: 'E-mail ou senha incorretos.' });
            } catch (error) {
                console.error('[AUTH] Erro no processo de login:', error);
                res.render('login', { error: 'Erro interno do servidor.' });
            }
        });

        app.post('/cadastro', async (req, res) => {
            const { name, email, password, confirmPassword } = req.body;
            
            if (!name || !email || !password || !confirmPassword) {
                return res.render('cadastro', { error: 'Todos os campos são obrigatórios.' });
            }
            
            if (password !== confirmPassword) {
                return res.render('cadastro', { error: 'As senhas não coincidem.' });
            }

            try {
                const existingUser = await db.collection('users').findOne({ email });
                if (existingUser) {
                    return res.render('cadastro', { error: 'Este e-mail já está cadastrado.' });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await db.collection('users').insertOne({
                    name,
                    email,
                    password: hashedPassword,
                    profilePic: null,
                    bio: '',
                    friends: [],
                    friendRequests: [],
                    notifications: [],
                    eventsJoined: [],
                    createdAt: new Date()
                });

                req.session.user = { id: result.insertedId.toString(), name, email };
                req.session.save(() => {
                    res.redirect('/perfil');
                });
            } catch (error) {
                console.error('Erro no cadastro:', error);
                res.render('cadastro', { error: 'Erro ao criar conta. Tente novamente.' });
            }
        });

        app.post('/perfil/update', async (req, res) => {
            if (!req.session.user) return res.status(401).json({ error: 'Não autorizado' });
            
            const { bio, profilePic } = req.body;
            const userId = new ObjectId(req.session.user.id);

            try {
                const updateData = {};
                if (bio !== undefined) updateData.bio = bio;
                if (profilePic !== undefined) updateData.profilePic = profilePic;

                await db.collection('users').updateOne(
                    { _id: userId },
                    { $set: updateData }
                );

                res.json({ success: true });
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                res.status(500).json({ error: 'Erro interno ao salvar perfil' });
            }
        });

        app.post('/evento/inscrever', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            
            const eventId = req.body.eventId;
            if (!eventId) return res.redirect('/eventos');

            try {
                const userId = new ObjectId(req.session.user.id);
                const eid = new ObjectId(eventId);
                
                await db.collection('users').updateOne(
                    { _id: userId },
                    { $addToSet: { eventsJoined: eid } }
                );

                // Adicionar usuário à lista de participantes do evento
                await db.collection('events').updateOne(
                    { _id: eid },
                    { $addToSet: { participants: userId } }
                );
                
                res.redirect(`/evento?id=${eventId}`);
            } catch (error) {
                console.error('Erro ao se inscrever:', error);
                res.redirect(req.get('Referrer') || '/');
            }
        });

        app.post('/evento/cancelar', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            
            const eventId = req.body.eventId;
            if (!eventId) return res.redirect('/eventos');

            try {
                const userId = new ObjectId(req.session.user.id);
                const eid = new ObjectId(eventId);
                
                await db.collection('users').updateOne(
                    { _id: userId },
                    { $pull: { eventsJoined: eid } }
                );

                // Remover usuário da lista de participantes do evento
                await db.collection('events').updateOne(
                    { _id: eid },
                    { $pull: { participants: userId } }
                );
                
                res.redirect(`/evento?id=${eventId}`);
            } catch (error) {
                console.error('Erro ao cancelar inscrição:', error);
                res.redirect(req.get('Referrer') || '/');
            }
        });

        app.post('/amizade/request', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            
            const targetId = new ObjectId(req.body.targetId);
            const myId = new ObjectId(req.session.user.id);

            try {
                // Adiciona solicitação ao alvo
                await db.collection('users').updateOne(
                    { _id: targetId },
                    { 
                        $addToSet: { 
                            friendRequests: { 
                                fromId: myId, 
                                fromName: req.session.user.name,
                                date: new Date(),
                                status: 'pending'
                            } 
                        },
                        $push: {
                            notifications: {
                                id: new ObjectId(),
                                type: 'friend_request',
                                fromId: myId,
                                fromName: req.session.user.name,
                                date: new Date(),
                                read: false
                            }
                        }
                    }
                );
                res.redirect(req.get('Referrer') || '/');
            } catch (error) {
                console.error('Erro ao solicitar amizade:', error);
                res.redirect(req.get('Referrer') || '/');
            }
        });

        app.post('/amizade/respond', async (req, res) => {
            if (!req.session.user) return res.status(401).send('Não autorizado');
            
            const { fromId, action } = req.body; // action: accept or decline
            const myId = new ObjectId(req.session.user.id);
            const senderId = new ObjectId(fromId);

            try {
                if (action === 'accept') {
                    // Adiciona aos amigos de ambos
                    await db.collection('users').updateOne({ _id: myId }, { $addToSet: { friends: senderId } });
                    await db.collection('users').updateOne({ _id: senderId }, { $addToSet: { friends: myId } });
                    
                    // Notificar o remetente que o pedido foi aceito
                    await db.collection('users').updateOne(
                        { _id: senderId },
                        { 
                            $push: {
                                notifications: {
                                    id: new ObjectId(),
                                    type: 'request_accepted',
                                    fromId: myId,
                                    fromName: req.session.user.name,
                                    date: new Date(),
                                    read: false
                                }
                            }
                        }
                    );
                }

                // Remove a solicitação
                await db.collection('users').updateOne(
                    { _id: myId },
                    { $pull: { friendRequests: { fromId: senderId } } }
                );

                res.redirect(req.get('Referrer') || '/');
            } catch (error) {
                console.error('Erro ao responder amizade:', error);
                res.redirect(req.get('Referrer') || '/');
            }
        });

        app.post('/projeto/like', async (req, res) => {
            if (!req.session.user) return res.status(401).json({ error: 'Necessário login' });
            
            try {
                const userId = new ObjectId(req.session.user.id);
                const pid = new ObjectId(req.body.projectId);
                
                const post = await db.collection('posts').findOne({ _id: pid });
                if (!post) return res.status(404).json({ error: 'Projeto não encontrado' });

                const hasLiked = post.likes?.some(id => id.toString() === userId.toString());
                const op = hasLiked ? '$pull' : '$addToSet';
                
                await db.collection('posts').updateOne({ _id: pid }, { [op]: { likes: userId } });
                
                const updatedPost = await db.collection('posts').findOne({ _id: pid });
                const count = updatedPost.likes ? updatedPost.likes.length : 0;
                
                res.json({ 
                    success: true, 
                    count, 
                    hasLiked: !hasLiked 
                });
            } catch (error) {
                console.error('Erro no like:', error);
                res.status(500).json({ error: 'Erro interno' });
            }
        });

        app.get('/api/search/global', async (req, res) => {
            const query = req.query.q;
            if (!query || query.length < 2) return res.json([]);
            
            try {
                // SEGURANÇA: Escapar caracteres especiais para evitar NoSQL Injection via Regex
                const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Busca Projetos
                const projects = await db.collection('posts').find({
                    title: { $regex: safeQuery, $options: 'i' }
                }).limit(5).toArray();
                
                // Busca Usuários
                const users = await db.collection('users').find({
                    name: { $regex: safeQuery, $options: 'i' }
                }).limit(5).toArray();
                
                const results = [
                    ...projects.map(p => ({
                        id: p._id,
                        title: p.title,
                        slug: p.slug,
                        type: 'projeto',
                        category: p.category,
                        image: p.image
                    })),
                    ...users.map(u => ({
                        id: u._id,
                        title: u.name,
                        type: 'usuario',
                        category: 'Usuário',
                        image: u.profilePic
                    }))
                ];
                
                res.json(results);
            } catch (error) {
                console.error('Erro na busca global:', error);
                res.status(500).json({ error: 'Erro interno' });
            }
        });

        app.post('/projeto/comentar', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            
            const { projectId, content } = req.body;
            if (!projectId || !content) return res.redirect('back');

            try {
                const pid = new ObjectId(projectId);
                const comment = {
                    userId: new ObjectId(req.session.user.id),
                    userName: req.session.user.name,
                    content: content,
                    createdAt: new Date()
                };

                await db.collection('posts').updateOne(
                    { _id: pid },
                    { $push: { comments: comment } }
                );

                res.redirect(`/projeto?id=${projectId}`);
            } catch (error) {
                console.error('Erro ao comentar:', error);
                res.redirect('/');
            }
        });

        app.get('/logout', (req, res) => {
            req.session.destroy((err) => {
                if (err) console.error('Erro ao destruir sessão:', err);
                res.clearCookie('IMPACTA_SESSION_ID');
                res.redirect('/');
            });
        });

        app.post('/notificacoes/ler', async (req, res) => {
            if (!req.session.user) return res.status(401).send();
            try {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(req.session.user.id) },
                    { $set: { "notifications.$[].read": true } }
                );
                res.status(200).send();
            } catch (error) {
                console.error('Erro ao marcar notificações:', error);
                res.status(500).send();
            }
        });

        // --- ROTAS DE RECUPERAÇÃO DE SENHA ---
        app.get('/esqueci-senha', (req, res) => res.render('esqueci-senha', { error: null, success: null }));

        app.post('/esqueci-senha', async (req, res) => {
            const { email } = req.body;
            console.log(`[RECUPERAÇÃO] Solicitação recebida para: ${email}`);
            try {
                const userDoc = await db.collection('users').findOne({ email });
                if (!userDoc) {
                    return res.render('esqueci-senha', { error: 'E-mail não encontrado.', success: null });
                }

                // Gerar token de 32 bytes (64 hex chars)
                const token = crypto.randomBytes(32).toString('hex');
                const expires = Date.now() + 3600000; // 1 hora

                await db.collection('users').updateOne(
                    { _id: userDoc._id },
                    { $set: { resetToken: token, resetTokenExpires: expires } }
                );

                const resetLink = `http://${req.headers.host}/resetar-senha?token=${token}`;

                // Enviar e-mail (usando try/catch pois o SMTP pode falhar se não configurado)
                try {
                    await transporter.sendMail({
                        from: '"Impacta Mais" <no-reply@impactamais.com>',
                        to: email,
                        subject: 'Recuperação de Senha - Impacta Mais',
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <h2 style="color: #0f172a;">Recuperação de Senha</h2>
                                <p>Olá, <strong>${userDoc.name}</strong>.</p>
                                <p>Você solicitou a redefinição de senha para sua conta no Impacta Mais. Clique no botão abaixo para criar uma nova senha:</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${resetLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Minha Senha</a>
                                </div>
                                <p style="font-size: 0.85rem; color: #64748b;">Este link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
                            </div>
                        `
                    });
                    res.render('esqueci-senha', { error: null, success: 'Link de recuperação enviado! Verifique sua caixa de entrada.' });
                } catch (emailError) {
                    console.error('Erro ao enviar e-mail:', emailError);
                    // MODO DESENVOLVEDOR: Link direto na tela
                    res.render('esqueci-senha', { 
                        error: null, 
                        success: `🚀 [MODO TESTE ATIVO] Clique aqui para mudar a senha: <a href="${resetLink}" style="font-weight: bold; color: #059669;">REDEFINIR AGORA</a>` 
                    });
                }
            } catch (error) {
                console.error('Erro na recuperação de senha:', error);
                res.render('esqueci-senha', { error: 'Erro interno do servidor.', success: null });
            }
        });

        app.get('/resetar-senha', async (req, res) => {
            const { token } = req.query;
            if (!token) return res.redirect('/login');

            try {
                const userDoc = await db.collection('users').findOne({
                    resetToken: token,
                    resetTokenExpires: { $gt: Date.now() }
                });

                if (!userDoc) {
                    return res.render('esqueci-senha', { error: 'Link de recuperação inválido ou expirado.', success: null });
                }

                res.render('resetar-senha', { token, error: null });
            } catch (error) {
                res.redirect('/login');
            }
        });

        app.post('/resetar-senha', async (req, res) => {
            const { token, password, confirmPassword } = req.body;

            if (!token || !password || !confirmPassword) {
                return res.render('resetar-senha', { token, error: 'Todos os campos são obrigatórios.' });
            }

            if (password !== confirmPassword) {
                return res.render('resetar-senha', { token, error: 'As senhas não coincidem.' });
            }

            try {
                const userDoc = await db.collection('users').findOne({
                    resetToken: token,
                    resetTokenExpires: { $gt: Date.now() }
                });

                if (!userDoc) {
                    return res.render('esqueci-senha', { error: 'Sessão de recuperação expirada.', success: null });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                await db.collection('users').updateOne(
                    { _id: userDoc._id },
                    { 
                        $set: { password: hashedPassword },
                        $unset: { resetToken: "", resetTokenExpires: "" }
                    }
                );

                res.render('login', { success: 'Senha alterada com sucesso! Faça login com sua nova senha.', error: null });
            } catch (error) {
                console.error('Erro ao resetar senha:', error);
                res.render('resetar-senha', { token, error: 'Erro ao salvar nova senha.' });
            }
        });

        app.get('/mensagens/:friendId', async (req, res) => {
            if (!req.session.user) return res.redirect('/login');
            
            const myId = new ObjectId(req.session.user.id);
            const friendId = new ObjectId(req.params.friendId);

            try {
                // Verificar se são amigos
                const me = await db.collection('users').findOne({ _id: myId });
                if (!me.friends?.some(fId => fId.toString() === friendId.toString())) {
                    return res.redirect('/perfil');
                }

                const friend = await db.collection('users').findOne({ _id: friendId });
                
                // Buscar histórico
                const messages = await db.collection('messages').find({
                    $or: [
                        { senderId: myId, receiverId: friendId },
                        { senderId: friendId, receiverId: myId }
                    ]
                }).sort({ timestamp: 1 }).toArray();

                res.render('chat', { friend, messages });
            } catch (error) {
                console.error('Erro ao carregar chat:', error);
                res.redirect('/perfil');
            }
        });

        app.post('/mensagens/send', async (req, res) => {
            if (!req.session.user) return res.status(401).json({ error: 'Não autorizado' });
            
            const { receiverId, content } = req.body;
            const myId = new ObjectId(req.session.user.id);
            const rId = new ObjectId(receiverId);

            try {
                const message = {
                    senderId: myId,
                    receiverId: rId,
                    content,
                    timestamp: new Date(),
                    read: false
                };

                await db.collection('messages').insertOne(message);

                // Adicionar notificação ao destinatário
                await db.collection('users').updateOne(
                    { _id: rId },
                    { 
                        $push: {
                            notifications: {
                                id: new ObjectId(),
                                type: 'new_message',
                                fromId: myId,
                                fromName: req.session.user.name,
                                content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                date: new Date(),
                                read: false
                            }
                        }
                    }
                );

                res.json({ success: true, message });
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                res.status(500).json({ error: 'Erro ao enviar' });
            }
        });

        app.get('/mensagens/sync/:friendId', async (req, res) => {
            if (!req.session.user) return res.status(401).json({ error: 'Não autorizado' });
            
            const myId = new ObjectId(req.session.user.id);
            const friendId = new ObjectId(req.params.friendId);

            try {
                const messages = await db.collection('messages').find({
                    $or: [
                        { senderId: myId, receiverId: friendId },
                        { senderId: friendId, receiverId: myId }
                    ]
                }).sort({ timestamp: 1 }).toArray();

                res.json({ messages });
            } catch (error) {
                console.error('Erro ao sincronizar mensagens:', error);
                res.status(500).json({ error: 'Erro ao sincronizar' });
            }
        });

        app.listen(PORT, () => {
            console.log(`\nSITE ATIVO: http://localhost:${PORT}\n`);
        });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    }
}

startServer();
