// Importa os módulos necessários
const express = require('express'); // Framework para criar servidores web
const path = require('path'); // Módulo para manipulação de caminhos de arquivos
const session = require('express-session'); // Middleware para gerenciar sessões de usuário

const app = express(); // Cria uma instância do aplicativo Express

// Configura o middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Configura o middleware para analisar dados do corpo da requisição (URL encoded)
app.use(express.urlencoded({ extended: true }));

const port = 3000; // Define a porta do servidor
let password = ""; // Variável global para armazenar a senha

// Configura o middleware de sessão com opções de segurança
app.use(session({
    secret: 'web_key_univali', // Chave secreta para assinatura de cookies de sessão
    resave: false, // Evita salvar a sessão de volta no armazenamento se não houver alterações
    saveUninitialized: false, // Evita salvar sessões não inicializadas
    cookie: {
        httpOnly: true, // Define o cookie como acessível apenas via HTTP (não JavaScript)
        sameSite: 'strict' // Define a política de cookies para não permitir o envio de cookies em contextos de navegação cruzada
    }
}));

// Função para gerar HTML com informações do usuário
function buildHtmlUser(user, pass) {
    return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Acesso Restrito</title>
                <link rel="stylesheet" href="/css/styleRestrito.css">
            </head>
            <body>
                <div class="container">
                    <h1>Bem vindo, <span id="userName">${user}</span>!</h1>
                    <p>Aqui estão suas informações restritas: </p>
                    <p>Usuário: ${user}</p>
                    <p>Senha: ${pass} </p>
                    <button class="logout-button" onclick="logout()">Desconectar</button>
                </div>
                <script>
                    function logout() {
                        window.location.href = '/logout'; // Redireciona para a rota de logout quando o botão é clicado
                    }
                </script>
            </body>
            </html>`;
}

// Rota para a página inicial
app.get('/', (req, res) => {
    if (req.session.user) {
        // Se o usuário estiver autenticado, mostra a página restrita
        res.status(200).send(buildHtmlUser(req.session.user, password));
    } else {
        // Caso contrário, exibe a página de login
        res.status(200).sendFile(path.join(__dirname, 'views', 'login.html'));
    }
});

// Rota para o processamento do formulário de login
app.post('/register', (req, res) => {
    const { user, pass, rememberMe } = req.body; // Obtém dados do formulário

    // Verifica se o usuário e a senha são válidos
    if (user === 'admin' && pass === 'admin') {
        req.session.user = user; // Armazena o usuário na sessão
        password = pass; // Armazena a senha para uso posterior
        if (rememberMe) {
            req.session.cookie.maxAge = ((3600 * 24 * 1000) * 3) - (3 * 3600 * 1000); // Define o tempo de expiração do cookie se "lembrar-me" estiver ativado
        } else {
            req.session.cookie.expires = false; // Define o cookie para expirar quando o navegador for fechado
        }
        res.redirect('/acessoRestrito'); // Redireciona para a página restrita
    } else {
        req.session.user = user; // Armazena o usuário na sessão
        res.status(401).redirect('/errorLogin'); // Redireciona para a página de erro de login
    }
});

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao encerrar a sessão.'); // Trata erro ao destruir a sessão
        }
        res.clearCookie('connect.sid'); // Limpa o cookie de sessão
        res.redirect('/'); // Redireciona para a página inicial
    });
});

// Rota para acesso restrito
app.get('/acessoRestrito', (req, res) => {
    if (!req.session.user) {
        // Se não estiver autenticado, mostra a página de acesso negado
        res.sendFile(path.join(__dirname, 'views', 'semPermissao.html'));
    } else {
        // Caso contrário, mostra a página restrita com informações do usuário
        res.status(200).send(buildHtmlUser(req.session.user, password));
    }
});

// Rota para a página de erro de login
app.get('/errorLogin', (req, res) => {

    if (!req.session.user) {
        res.status(200).sendFile(path.join(__dirname, 'views', 'semPermissao.html')); // Mostra a página de acesso negado
    } else {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Erro ao encerrar a sessão.'); // Trata erro ao destruir a sessão
            }
            res.clearCookie('connect.sid'); // Limpa o cookie de sessão
            res.status(200).sendFile(path.join(__dirname, 'views', 'errorLogin.html')); // Mostra a página de erro de login
        });
    }
});

// Inicia o servidor na porta definida
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`); // Mensagem de confirmação no console
});
