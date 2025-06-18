// renderer.js
// IMPORTANTE: As credenciais do Firebase NÃO devem ser hardcoded aqui.
// Elas virão do `preload.js` (que as pegou do `main.js`, que leu do `.env`).

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Acessa as configurações do Firebase que foram expostas pelo preload script
const firebaseConfig = window.firebaseConfig;

let db; // Variável para o Firestore

if (firebaseConfig && firebaseConfig.apiKey) {
    // Inicializa o Firebase
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app); // Atribui a instância do Firestore à variável global
    console.log("Firebase inicializado no processo de renderização!");

    // Chamadas iniciais ou configuração de listeners aqui
    document.addEventListener('DOMContentLoaded', () => {
        carregarProdutos(); // Exemplo de função para carregar dados
    });

} else {
    console.error("Configurações do Firebase não disponíveis. Verifique o preload.js e .env");
    const appDiv = document.getElementById('app-content');
    if (appDiv) appDiv.innerHTML = '<p style="color: red;">Erro: Configuração do Firebase ausente.</p>';
}

// --- Funções de Exemplo para Interagir com o Firestore ---

async function carregarProdutos() {
    if (!db) {
        console.error("Firestore não inicializado.");
        return;
    }
    try {
        const produtosRef = collection(db, 'produtos'); // Supondo que sua coleção seja 'produtos'
        const snapshot = await getDocs(produtosRef);
        const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const appDiv = document.getElementById('app-content');
        if (appDiv) {
            let html = '<h2>Produtos Cadastrados:</h2>';
            if (produtos.length > 0) {
                html += '<ul>';
                produtos.forEach(produto => {
                    html += `<li>ID: ${produto.id}, Nome: ${produto.nome || 'N/A'}, Preço: ${produto.preco || 'N/A'} <button onclick="editarProduto('${produto.id}')">Editar</button> <button onclick="deletarProduto('${produto.id}')">Deletar</button></li>`;
                });
                html += '</ul>';
            } else {
                html += '<p>Nenhum produto encontrado.</p>';
            }
            // Adicionar um formulário simples para adicionar produtos
            html += `
                <h3>Adicionar Novo Produto</h3>
                <input type="text" id="produtoNome" placeholder="Nome do Produto">
                <input type="number" id="produtoPreco" placeholder="Preço">
                <button onclick="adicionarProduto()">Adicionar</button>
            `;
            appDiv.innerHTML = html;
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        const appDiv = document.getElementById('app-content');
        if (appDiv) appDiv.innerHTML = '<p style="color: red;">Erro ao carregar produtos. Verifique o console.</p>';
    }
}

async function adicionarProduto() {
    if (!db) {
        console.error("Firestore não inicializado.");
        return;
    }
    const nome = document.getElementById('produtoNome').value;
    const preco = parseFloat(document.getElementById('produtoPreco').value);

    if (!nome || isNaN(preco)) {
        alert('Por favor, preencha nome e preço válidos.');
        return;
    }

    try {
        await addDoc(collection(db, 'produtos'), {
            nome: nome,
            preco: preco,
            createdAt: new Date() // Opcional: Adiciona um timestamp
        });
        alert('Produto adicionado com sucesso!');
        document.getElementById('produtoNome').value = ''; // Limpa o formulário
        document.getElementById('produtoPreco').value = '';
        carregarProdutos(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        alert('Erro ao adicionar produto.');
    }
}

async function editarProduto(id) {
    if (!db) {
        console.error("Firestore não inicializado.");
        return;
    }
    // Implemente a lógica de edição aqui.
    // Você pode abrir um modal, um novo formulário, etc.
    const novoNome = prompt('Novo nome do produto:');
    const novoPreco = parseFloat(prompt('Novo preço do produto:'));

    if (!novoNome || isNaN(novoPreco)) {
        alert('Nome e preço válidos são necessários para a edição.');
        return;
    }

    try {
        const produtoDocRef = doc(db, 'produtos', id);
        await updateDoc(produtoDocRef, {
            nome: novoNome,
            preco: novoPreco,
            updatedAt: new Date()
        });
        alert('Produto atualizado com sucesso!');
        carregarProdutos();
    } catch (error) {
        console.error("Erro ao editar produto:", error);
        alert('Erro ao editar produto.');
    }
}

async function deletarProduto(id) {
    if (!db) {
        console.error("Firestore não inicializado.");
        return;
    }
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        try {
            const produtoDocRef = doc(db, 'produtos', id);
            await deleteDoc(produtoDocRef);
            alert('Produto deletado com sucesso!');
            carregarProdutos();
        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            alert('Erro ao deletar produto.');
        }
    }
}

// Expondo funções para o escopo global para que possam ser chamadas do HTML (onclick)
// Esta é uma prática para exemplos simples. Em aplicações maiores, use listeners de eventos.
window.adicionarProduto = adicionarProduto;
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;