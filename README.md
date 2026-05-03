# 🌟 Impacta Mais - Hub de Projetos Sociais

https://impactamaisia.onrender.com
O **Impacta Mais** é uma plataforma dinâmica projetada para conectar voluntários, doadores e entusiastas de causas sociais. Nosso objetivo é facilitar a criação, gestão e engajamento em projetos e eventos que transformam realidades nas áreas de educação, meio ambiente e saúde.

![Status do Projeto](https://img.shields.io/badge/Status-Completo%20%2F%20Seguro-brightgreen)
![Tecnologias](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20MongoDB-blue)

---

## 🚀 Funcionalidades Principais

- **Autenticação Segura**: Sistema de login e cadastro com criptografia de senhas (bcrypt).
- **Recuperação de Senha**: Fluxo completo de redefinição de senha via e-mail com tokens temporários.
- **Rede Social**: Perfis públicos, sistema de amizades, notificações em tempo real e chat privado entre amigos.
- **Gestão de Projetos**: Criação de projetos sociais com sistema de curtidas (AJAX) e comentários.
- **Eventos Comunitários**: Inscrição em eventos com contador de participantes e integração no perfil do usuário.
- **Segurança Reforçada**: Proteção contra NoSQL Injection, cabeçalhos de segurança (Helmet) e sanitização de dados.

## 🛠️ Tecnologias Utilizadas

- **Backend**: [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/)
- **Banco de Dados**: [MongoDB](https://www.mongodb.com/) (Driver Nativo)
- **Frontend**: EJS (Embedded JavaScript templates) & CSS Vanilla
- **Segurança**: Helmet, BcryptJS, Express-Session, Mongo-Store
- **Comunicação**: Nodemailer (Integração com Gmail SMTP)
- **Ícones**: Lucide Icons

---

## 💻 Como Rodar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Eman-coder00/impactaMaisIA.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto seguindo o modelo do `.env.example`:
   ```env
   MONGODB_URI=sua_url_do_mongodb
   MONGODB_DB=impacta_mais
   PORT=3000
   SESSION_SECRET=sua_chave_secreta
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASS=sua-senha-de-aplicativo
   ```

4. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   `http://localhost:3000`

---

## 🛡️ Segurança e Boas Práticas

Este projeto foi desenvolvido seguindo rigorosos padrões de segurança para proteger os dados dos usuários:
- **Sanitização de Regex**: Prevenção de ataques de negação de serviço (DoS) via expressões regulares.
- **Proteção CSRF/HSTS**: Implementada via Helmet.
- **Gestão de Sessão**: Armazenada de forma persistente e segura no MongoDB.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de impacto social. Sinta-se à vontade para contribuir!

---
