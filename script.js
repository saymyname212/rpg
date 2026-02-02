// VARIÁVEIS GLOBAIS
let currentUser = null;

// AUXILIARES DE BANCO DE DADOS
const getDB = (key) => JSON.parse(localStorage.getItem(key));
const setDB = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// INICIALIZAÇÃO DO SISTEMA
function inicializarBanco() {
    if (!getDB('rpg_users')) {
        setDB('rpg_users', [{ 
            nick: 'Mestre', 
            email: 'antico@rpg.com', 
            pass: 'antico', 
            isAdmin: true, 
            gold: 0, 
            items: [] 
        }]);
    } else {
        // Garante que o Mestre existente tenha as novas credenciais
        let users = getDB('rpg_users');
        let mestre = users.find(u => u.isAdmin === true);
        if (mestre) {
            mestre.email = 'antico@rpg.com';
            mestre.pass = 'antico';
            setDB('rpg_users', users);
        }
    }
    
    if (!getDB('rpg_items')) {
        setDB('rpg_items', []);
    }
}
inicializarBanco();

// NAVEGAÇÃO ENTRE TELAS
function navegar(tela) {
    document.querySelectorAll('.portal-container').forEach(div => div.classList.add('hidden'));
    document.getElementById(tela).classList.remove('hidden');
    
    if (tela === 'screen-player') atualizarInterfacePlayer();
    if (tela === 'screen-admin') renderizarAdmin();
}

// SISTEMA DE LOGIN
function realizarLogin() {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;
    const users = getDB('rpg_users');
    
    const user = users.find(u => (u.nick === id || u.email === id) && u.pass === pass);

    if (user) {
        if (user.banido) return alert("Sua alma foi banida deste reino!");
        currentUser = user; 
        user.isAdmin ? navegar('screen-admin') : navegar('screen-player');
    } else {
        alert("Credenciais incorretas! Use o novo login do Mestre.");
    }
}

// CADASTRO DE JOGADOR
function salvarNovoUsuario() {
    const nick = document.getElementById('reg-nick').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (!nick || !pass) return alert("Preencha os campos obrigatórios!");

    let users = getDB('rpg_users');
    if (users.some(u => u.nick === nick)) return alert("Este Herói já existe!");

    users.push({ nick, email, pass, gold: 500, isAdmin: false, items: [], banido: false });
    setDB('rpg_users', users);
    
    alert("Personagem criado! Você recebeu 500 moedas iniciais.");
    navegar('screen-login');
}

// --- SISTEMA DO JOGADOR (COMPRA E MOCHILA) ---

function atualizarInterfacePlayer() {
    if (!currentUser) return;
    document.getElementById('gold-val').innerText = currentUser.gold;
    
    const shopCont = document.getElementById('tab-shop');
    const itensLoja = getDB('rpg_items');
    shopCont.innerHTML = itensLoja.length ? "" : "<p>O ferreiro está sem estoque...</p>";

    itensLoja.forEach((item, idx) => {
        shopCont.innerHTML += `
            <div class="card-rpg">
                <img src="${item.image}" class="card-image">
                <div class="card-info">
                    <div class="card-name">${item.nome}</div>
                    <span class="card-price">${item.preco} 🪙</span>
                    <button class="btn btn-gold" onclick="comprarItem(${idx})">Comprar</button>
                </div>
            </div>`;
    });

    const invCont = document.getElementById('tab-inv');
    invCont.innerHTML = currentUser.items.length ? "" : "<p>Sua mochila está leve demais...</p>";
    
    currentUser.items.forEach((item) => {
        invCont.innerHTML += `
            <div class="card-rpg">
                <img src="${item.image}" class="card-image">
                <div class="card-info">
                    <div class="card-name">${item.nome}</div>
                    <span style="font-size:10px; color:#888">Item de Inventário</span>
                </div>
            </div>`;
    });
}

function comprarItem(idx) {
    const itensLoja = getDB('rpg_items');
    const item = itensLoja[idx];
    let users = getDB('rpg_users');
    let userIndex = users.findIndex(u => u.nick === currentUser.nick);

    if (currentUser.gold >= item.preco) {
        currentUser.gold -= item.preco;
        currentUser.items.push(item);

        users[userIndex] = currentUser;
        setDB('rpg_users', users);

        alert("Compra realizada: " + item.nome);
        atualizarInterfacePlayer();
    } else {
        alert("Você não tem ouro suficiente!");
    }
}

// --- PAINEL ADMINISTRATIVO ---

function renderizarAdmin() {
    const body = document.getElementById('admin-list-body');
    const users = getDB('rpg_users');
    body.innerHTML = "";

    users.forEach((u, uIdx) => {
        if (u.isAdmin) return; 
        
        let itensHtml = u.items.map((it, iIdx) => `
            <div style="display:flex; justify-content:space-between; padding:2px; border-bottom:1px solid #333">
                ${it.nome} <span onclick="removerItemDoPlayer(${uIdx}, ${iIdx})" style="color:red; cursor:pointer">X</span>
            </div>
        `).join('');

        body.innerHTML += `
            <tr>
                <td><b>${u.nick}</b><br>💰 ${u.gold}</td>
                <td><div class="inv-mini-list">${itensHtml || 'Vazio'}</div></td>
                <td>
                    <button onclick="darOuro(${uIdx})" title="Dar 100 de Ouro">💰+</button>
                    <button onclick="banirPlayer(${uIdx})" style="background:orange">${u.banido ? 'UNBAN' : 'BAN'}</button>
                </td>
            </tr>`;
    });
}

function darOuro(uIdx) {
    let users = getDB('rpg_users');
    users[uIdx].gold += 100;
    setDB('rpg_users', users);
    renderizarAdmin();
}

function banirPlayer(uIdx) {
    let users = getDB('rpg_users');
    users[uIdx].banido = !users[uIdx].banido;
    setDB('rpg_users', users);
    renderizarAdmin();
}

function removerItemDoPlayer(uIdx, iIdx) {
    let users = getDB('rpg_users');
    users[uIdx].items.splice(iIdx, 1);
    setDB('rpg_users', users);
    renderizarAdmin();
}

function adicionarItemNaLoja() {
    const nome = document.getElementById('new-item-name').value;
    const preco = parseInt(document.getElementById('new-item-price').value);
    const fileInput = document.getElementById('new-item-img');

    if (!nome || !preco || !fileInput.files[0]) return alert("Preencha todos os dados!");

    const reader = new FileReader();
    reader.onload = (e) => {
        let itens = getDB('rpg_items');
        itens.push({ nome, preco, image: e.target.result });
        setDB('rpg_items', itens);
        
        alert("Item forjado e enviado ao mercado!");
        document.getElementById('new-item-name').value = "";
        document.getElementById('new-item-price').value = "";
        renderizarAdmin();
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// CONTROLE DE ABAS
function switchPlayerTab(tab, btn) {
    document.getElementById('tab-shop').classList.toggle('hidden', tab !== 'shop');
    document.getElementById('tab-inv').classList.toggle('hidden', tab !== 'inv');
    document.querySelectorAll('#screen-player .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function switchAdminTab(tab, btn) {
    document.getElementById('admin-users').classList.toggle('hidden', tab !== 'users');
    document.getElementById('admin-add-item').classList.toggle('hidden', tab !== 'add-item');
    document.querySelectorAll('#screen-admin .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');// AGORA OS DADOS VÊM DA NUVEM
const setDB = (key, val) => {
    db.ref(key).set(val);
};

// Como o Firebase é lento para baixar, precisamos "escutar" as mudanças
function inicializarEscuta() {
    // Escuta Jogadores
    db.ref('rpg_users').on('value', (snapshot) => {
        const data = snapshot.val();
        localStorage.setItem('rpg_users', JSON.stringify(data || []));
        // Se estiver na tela de admin ou player, atualiza a visão
        if (!document.getElementById('screen-admin').classList.contains('hidden')) renderizarAdmin();
        if (!document.getElementById('screen-player').classList.contains('hidden')) atualizarInterfacePlayer();
    });

    // Escuta Itens da Loja
    db.ref('rpg_items').on('value', (snapshot) => {
        const data = snapshot.val();
        localStorage.setItem('rpg_items', JSON.stringify(data || []));
        if (!document.getElementById('screen-player').classList.contains('hidden')) atualizarInterfacePlayer();
    });
}
inicializarEscuta();
}


